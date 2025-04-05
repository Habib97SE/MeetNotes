'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Array<{ id: string; title: string; created_at: string }>>([]);

  useEffect(() => {
    async function fetchUserAndMeetings() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/sign-in');
      } else {
        const user = session.user;
        setFullName(user.user_metadata?.full_name || null);

        // TODO: Fetch real meetings from your database later.
        // For now, mock 2 meetings
        setMeetings([
          { id: '1', title: 'Team Standup', created_at: '2024-04-04' },
          { id: '2', title: 'Client Kickoff', created_at: '2024-04-03' },
        ]);

        setLoading(false);
      }
    }

    fetchUserAndMeetings();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome{fullName ? `, ${fullName}` : ''}!</h1>

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
              <h2 className="text-lg font-semibold">{meeting.title}</h2>
              <p className="text-sm text-gray-500">Created: {meeting.created_at}</p>
            </div>
          ))
        ) : (
          <p>No meetings yet. Start by uploading one!</p>
        )}
      </div>
    </div>
  );
}
