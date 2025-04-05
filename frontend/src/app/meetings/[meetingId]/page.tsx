'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MeetingDetailsPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<{
    title: string;
    summary: string;
    transcription: string;
  } | null>(null);

  useEffect(() => {
    async function fetchMeeting() {
      // For now, fake meeting details
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMeeting({
        title: `Meeting #${meetingId}`,
        summary: 'Action Points:\n- Follow up with client\n- Send design documents\n- Schedule next meeting',
        transcription: 'Hello everyone, today we discussed the new project timeline and tasks to be completed by next week...',
      });
      setLoading(false);
    }

    fetchMeeting();
  }, [meetingId]);

  if (loading) {
    return <div className="flex min-h-screen justify-center items-center">Loading...</div>;
  }

  if (!meeting) {
    return <div className="flex min-h-screen justify-center items-center">Meeting not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{meeting.title}</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <pre className="p-4 bg-gray-100 rounded-md">{meeting.summary}</pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Full Transcription</h2>
        <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">{meeting.transcription}</pre>
      </div>
    </div>
  );
}
