/**
 * Client for interacting with TUSD (TUS Daemon) for resumable uploads to Amazon S3
 * https://tus.io/
 */

import * as tus from 'tus-js-client';

interface UploadResponse {
  fileId: string;
  status: string;
  s3Key?: string;
  message?: string;
}

interface TranscriptionResult {
  transcriptionId: string;
  status: 'processing' | 'completed' | 'failed';
  text?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  error?: string;
}

export interface UploadProgressInfo {
  bytesUploaded: number;
  bytesTotal: number;
  uploadProgress: number;
}

/**
 * Upload an audio file using TUS protocol for resumable uploads
 */
export async function uploadAudio(
  file: File,
  endpoint: string = process.env.NEXT_PUBLIC_TUSD_ENDPOINT || '',
  onProgress?: (progress: UploadProgressInfo) => void,
  onError?: (error: Error) => void
): Promise<UploadResponse> {
  if (!endpoint) {
    throw new Error('TUSD endpoint is not configured');
  }

  return new Promise<UploadResponse>((resolve, reject) => {
    // Create a new tus upload
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
        // Additional metadata can be added for S3 storage options
        s3storage: 'true',
        bucketname: process.env.NEXT_PUBLIC_S3_BUCKET || 'meetings-audio',
        objectpath: `uploads/${Date.now()}-${file.name}`
      },
      onError: (error: Error) => {
        console.error('TUS upload error:', error);
        if (onError) onError(error);
        reject(error);
      },
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const uploadProgress = Math.round((bytesUploaded / bytesTotal) * 100);
        if (onProgress) {
          onProgress({ bytesUploaded, bytesTotal, uploadProgress });
        }
      },
      onSuccess: async () => {
        try {
          // The upload.url should contain the location of the completed upload
          // Extract fileId from the upload URL
          const urlParts = upload.url!.split('/');
          const fileId = urlParts[urlParts.length - 1];
          
          // S3 key from the object path
          const s3Key = `uploads/${Date.now()}-${file.name}`;
          
          // Return a response with fileId and S3 key
          resolve({
            fileId,
            status: 'uploaded',
            s3Key
          });
        } catch (error) {
          if (error instanceof Error) {
            if (onError) onError(error);
            reject(error);
          } else {
            const err = new Error('Unknown error during upload');
            if (onError) onError(err);
            reject(err);
          }
        }
      }
    });

    // Check if there are any previous uploads to resume
    upload.findPreviousUploads().then((previousUploads: tus.PreviousUpload[]) => {
      // If there are previous uploads, resume the most recent one
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      
      // Start the upload
      upload.start();
    });
  });
}

export async function getTranscriptionStatus(
  fileId: string,
  apiUrl: string = process.env.NEXT_PUBLIC_TRANSCRIPTION_API_URL || ''
): Promise<TranscriptionResult> {
  if (!apiUrl) {
    throw new Error('Transcription API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/transcription/${fileId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get transcription: ${response.status} ${errorText}`);
  }

  return await response.json();
}

export async function pollTranscriptionStatus(
  fileId: string, 
  maxAttempts: number = 30,
  interval: number = 3000
): Promise<TranscriptionResult> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await getTranscriptionStatus(fileId);
    
    if (result.status === 'completed') {
      return result;
    }
    
    if (result.status === 'failed') {
      throw new Error(`Transcription failed: ${result.error}`);
    }
    
    // Wait before the next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  throw new Error('Transcription timed out');
} 