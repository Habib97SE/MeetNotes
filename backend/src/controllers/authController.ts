import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// POST /api/v1/auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(201).json({ message: 'User signed up successfully!', user: data.user });
  } catch (error) {
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      res.status(401).json({ message: error?.message || 'Invalid credentials.' });
      return;
    }

    res.status(200).json({
      message: 'Login successful!',
      session: data.session, // Contains access_token, refresh_token, etc.
    });
  } catch (error) {
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
}

// POST /api/v1/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { user } = res.locals;

  if (!user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  // Client should clear tokens locally; we just return success here
  res.status(200).json({ message: 'Logout successful. Clear tokens client-side.' });
}

// GET /api/v1/auth/me
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  const { user } = res.locals;

  if (!user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
  });
}
