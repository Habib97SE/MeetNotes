import { supabase } from '@/lib/supabase-client';

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_id: string;
  s3_key?: string;
  duration?: number;
  transcription?: string;
  summary?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export async function createMeeting(data: Partial<Meeting>): Promise<Meeting | null> {
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }

  return meeting;
}

export async function updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting | null> {
  const { data: meeting, error } = await supabase
    .from('meetings')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }

  return meeting;
}

export async function getMeetingById(id: string): Promise<Meeting | null> {
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting meeting:', error);
    throw error;
  }

  return meeting;
}

export async function getMeetingsByUserId(userId: string): Promise<Meeting[]> {
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting meetings:', error);
    throw error;
  }

  return meetings || [];
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
} 