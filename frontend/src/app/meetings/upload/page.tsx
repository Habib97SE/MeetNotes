'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadAndProcessMeeting } from '@/features/meetings/meeting-service';
import { useAuth } from '@/features/auth/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function UploadMeetingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [resumableUploads, setResumableUploads] = useState<{[key: string]: number}>({});
  const router = useRouter();
  const { user } = useAuth();

  // Load any saved upload progress from localStorage on component mount
  useEffect(() => {
    try {
      const savedUploads = localStorage.getItem('resumableUploads');
      if (savedUploads) {
        setResumableUploads(JSON.parse(savedUploads));
      }
    } catch (err) {
      console.error('Error loading saved uploads:', err);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file size (limit to 100MB for example)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100MB limit');
        return;
      }
      
      // Check file type
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Only audio files are accepted');
        return;
      }
      
      setFile(selectedFile);
      
      // Check if we have a previously saved upload progress for this file
      const fileKey = `${selectedFile.name}-${selectedFile.size}`;
      if (resumableUploads[fileKey]) {
        setMessage(`Found a previous upload for this file at ${resumableUploads[fileKey]}%. You can resume it.`);
        setUploadProgress(resumableUploads[fileKey]);
      } else {
        setMessage(null);
        setUploadProgress(0);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to upload a meeting');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage('Starting upload...');

    try {
      // Save file key for resumable upload tracking
      const fileKey = `${file.name}-${file.size}`;
      
      const result = await uploadAndProcessMeeting(
        file, 
        user.id,
        (progress) => {
          // Update the UI with progress information
          setUploadProgress(progress.uploadProgress);
          
          // Save progress to localStorage for potential resume
          if (progress.uploadProgress % 5 === 0) { // Save every 5% to reduce writes
            const updatedUploads = { 
              ...resumableUploads, 
              [fileKey]: progress.uploadProgress 
            };
            setResumableUploads(updatedUploads);
            localStorage.setItem('resumableUploads', JSON.stringify(updatedUploads));
          }
          
          if (progress.uploadProgress === 100) {
            setMessage('Upload complete! Processing audio...');
            // Clean up completed upload from localStorage
            const updatedUploads = { ...resumableUploads };
            delete updatedUploads[fileKey];
            localStorage.setItem('resumableUploads', JSON.stringify(updatedUploads));
            setResumableUploads(updatedUploads);
          }
        },
        (error) => {
          // Handle upload errors
          setError(error.message);
          setUploading(false);
        }
      );
      
      setMessage(result.message || 'Meeting uploaded successfully! Processing will continue in the background.');
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center p-4">
      <form onSubmit={handleUpload} className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Upload Meeting Audio</h1>
        <p className="text-center text-gray-500">
          Upload your meeting audio file to have it transcribed and summarized
        </p>
        
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {message && (
          <Alert>
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="meetingAudio">Select Meeting Audio</Label>
          <Input
            id="meetingAudio"
            className="w-full"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={uploading}
            required
          />
          <p className="text-xs text-gray-500">
            Supported formats: MP3, WAV, M4A, AAC, FLAC (max 100MB)
          </p>
          <p className="text-xs text-blue-500">
            Uploads are resumable - if your connection drops, you can restart from where you left off.
          </p>
        </div>
        
        {uploadProgress > 0 && (
          <div className="w-full space-y-1">
            <div className="bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={uploading || !file}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadProgress < 100 ? `Uploading (${uploadProgress}%)` : 'Processing...'}
            </>
          ) : 'Upload and Process'}
        </Button>
      </form>
    </div>
  );
}
