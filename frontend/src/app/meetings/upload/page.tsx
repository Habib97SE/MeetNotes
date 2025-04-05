'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UploadMeetingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    try {
      // For now: Fake upload logic
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Later, you will POST file to your API here
      console.log('Uploaded file:', file);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center p-4">
      <form onSubmit={handleUpload} className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <Label htmlFor="meetingAudio">Select Meeting Audio</Label>
          <Input
            id="meetingAudio"
            className="w-full"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload and Process'}
        </Button>
      </form>
    </div>
  );
}
