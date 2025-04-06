import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { withRetry } from '../utils/supabaseRetry';
import { logger } from '../utils/logger';

// POST /api/v1/auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body;
    
    // Validate required fields
    if (!email || !password || !full_name) {
      res.status(400).json({ message: 'Email, password, and full name are required.' });
      return;
    }
    
    logger.info(`Attempting to sign up user with email: ${email}`);

    // Sign up user with Supabase Auth
    const { data, error } = await withRetry(
      () => supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
          },
        },
      }),
      { operationName: 'User signup' }
    );

    if (error) {
      logger.warn(`Signup failed for email: ${email}`, { error: error.message });
      res.status(400).json({ message: error.message });
      return;
    }

    // If user was created successfully, create a profile record
    if (data.user) {
      try {
        // Create profile in the profiles table
        const { error: profileError } = await withRetry(
          () => supabase
            .from('profiles')
            .insert({
              id: data.user?.id,
              full_name,
              email
            }),
          { operationName: 'Create user profile' }
        );

        if (profileError) {
          logger.warn(`Profile creation failed for user ID: ${data.user.id}`, { error: profileError.message });
          // We don't fail the signup if profile creation fails, just log it
        } else {
          logger.info(`Profile created for user ID: ${data.user.id}`);
        }
      } catch (profileError) {
        logger.error(`Error creating profile for user ID: ${data.user.id}`, 
          profileError instanceof Error ? profileError : undefined);
        // We don't fail the signup if profile creation fails, just log it
      }
    }

    logger.info(`User signed up successfully: ${email}`);
    res.status(201).json({ 
      message: 'User signed up successfully!', 
      user: {
        id: data.user?.id,
        email: data.user?.email,
        full_name
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Signup process failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    logger.info(`Login attempt for user: ${email}`);

    const { data, error } = await withRetry(
      () => supabase.auth.signInWithPassword({
        email,
        password,
      }),
      { operationName: 'User login' }
    );

    if (error || !data.session) {
      logger.warn(`Login failed for email: ${email}`, { error: error?.message });
      res.status(401).json({ message: error?.message || 'Invalid credentials.' });
      return;
    }

    logger.info(`User logged in successfully: ${email}`);
    res.status(200).json({
      message: 'Login successful!',
      session: data.session, // Contains access_token, refresh_token, etc.
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Login process failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}

// POST /api/v1/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { user } = res.locals;

  if (!user) {
    logger.warn('Logout attempt without authentication');
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  logger.info(`User logged out: ${user.email}`);
  // Client should clear tokens locally; we just return success here
  res.status(200).json({ message: 'Logout successful. Clear tokens client-side.' });
}

// GET /api/v1/auth/me
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;

    if (!user) {
      logger.warn('Current user request without authentication');
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    logger.debug(`Current user data accessed: ${user.email}`);
    res.status(200).json({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Current user retrieval failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}
