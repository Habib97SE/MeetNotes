import { uploadAudio, pollTranscriptionStatus, UploadProgressInfo } from '@/lib/tus-client';
import { createMeeting, updateMeeting } from './meeting-repository';

export interface UploadMeetingResult {
  meetingId: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}

export async function uploadAndProcessMeeting(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgressInfo) => void,
  onError?: (error: Error) => void
): Promise<UploadMeetingResult> {
  try {
    // 1. Upload to TUSD with resumable upload to S3
    const uploadResult = await uploadAudio(
      file, 
      process.env.NEXT_PUBLIC_TUSD_ENDPOINT,
      onProgress,
      onError
    );

    // 2. Create meeting record in database
    const meeting = await createMeeting({
      user_id: userId,
      title: file.name.split('.')[0], // Use filename without extension as the title
      original_filename: file.name,
      file_id: uploadResult.fileId,
      s3_key: uploadResult.s3Key,
      status: 'processing',
    });

    if (!meeting) {
      throw new Error('Failed to create meeting record');
    }

    // 3. Start background processing (in real app, this would be a separate process)
    // Here we're doing it inline for simplicity
    processTranscription(meeting.id, uploadResult.fileId).catch(error => {
      console.error('Error processing transcription:', error);
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    });

    return {
      meetingId: meeting.id,
      status: 'processing',
      message: 'Meeting uploaded to S3. Transcription in progress.',
    };
  } catch (error) {
    console.error('Error in uploadAndProcessMeeting:', error);
    if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Function to handle future S3 integration
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function uploadToS3(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgressInfo) => void,
  onError?: (error: Error) => void
): Promise<UploadMeetingResult> {
  // This is a placeholder for future S3 integration
  throw new Error('S3 upload not implemented yet');
}
/* eslint-enable @typescript-eslint/no-unused-vars */

async function processTranscription(meetingId: string, fileId: string): Promise<void> {
  try {
    // Poll for transcription completion
    const transcriptionResult = await pollTranscriptionStatus(fileId);

    // Update meeting with transcription
    await updateMeeting(meetingId, {
      status: 'completed',
      transcription: transcriptionResult.text,
      // You can add summary generation here as well
    });
  } catch (error) {
    console.error('Error processing transcription:', error);
    
    // Update meeting with error status
    await updateMeeting(meetingId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error during transcription',
    });
    
    throw error;
  }
} 