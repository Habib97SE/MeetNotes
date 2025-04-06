'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { getMeetingsByUserId, Meeting } from '@/features/meetings/meeting-repository';
import { formatDistanceToNow } from 'date-fns';
import { FileAudio, AlertCircle, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading, error } = useAuth();

  useEffect(() => {
    async function fetchMeetings() {
      if (user?.id) {
        try {
          const userMeetings = await getMeetingsByUserId(user.id);
          setMeetings(userMeetings);
        } catch (err) {
          console.error('Error fetching meetings:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (!loading && user) {
      fetchMeetings();
    } else if (!loading && !user) {
      setIsLoading(false);
    }
  }, [user, loading]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">You must be logged in to access this page.</p>
        <Button onClick={() => router.push('/auth/sign-in')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome{user?.full_name ? `, ${user?.full_name}` : ''}!</h1>

      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push('/meetings/upload')}>
          Upload New Meeting
        </Button>
      </div>

      <div className="space-y-4">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => router.push(`/meetings/${meeting.id}`)}
              className="p-4 border rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">{meeting.title}</h2>
                </div>
                {meeting.status === 'processing' && (
                  <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Processing
                  </span>
                )}
                {meeting.status === 'completed' && (
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Completed
                  </span>
                )}
                {meeting.status === 'failed' && (
                  <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Failed
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Created: {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
              </p>
              
              {meeting.original_filename && (
                <p className="text-xs text-gray-400 mt-1">
                  {meeting.original_filename}
                  {meeting.s3_key && <span className="ml-2">S3: {meeting.s3_key}</span>}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-10 border rounded-lg bg-gray-50">
            <FileAudio className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-gray-600">No meetings yet. Start by uploading one!</p>
            <Button 
              onClick={() => router.push('/meetings/upload')}
              variant="outline"
              className="mt-4"
            >
              Upload Your First Meeting
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
