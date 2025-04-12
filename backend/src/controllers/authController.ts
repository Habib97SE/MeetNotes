import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { withRetry } from '../utils/supabaseRetry';
import { logger } from '../utils/logger';
import { setAuthCookies, clearAuthCookies, refreshTokens } from '../utils/tokenManager';
import { PostgrestError } from '@supabase/supabase-js';

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
        // Create profile in the profiles table using a simpler approach that avoids type issues
        await withRetry(
          async () => {
            const result = await supabase
              .from('profiles')
              .insert({
                id: data.user?.id,
                full_name,
                email
              });
            
            if (result.error) {
              logger.warn(`Profile creation failed for user ID: ${data.user!.id}`, { 
                error: result.error.message 
              });
            } else {
              logger.info(`Profile created for user ID: ${data.user!.id}`);
            }
            
            return result;
          },
          { operationName: 'Create user profile' }
        );
      } catch (profileError) {
        logger.error(`Error creating profile for user ID: ${data.user.id}`, 
          profileError instanceof Error ? profileError : undefined);
        // We don't fail the signup if profile creation fails, just log it
      }
    }

    // Set secure cookies with tokens if session is available
    if (data.session) {
      setAuthCookies(res, data.session.access_token, data.session.refresh_token);
    }

    logger.info(`User signed up successfully: ${email}`);
    res.status(201).json({ 
      message: 'User signed up successfully!', 
      user: {
        id: data.user?.id,
        email: data.user?.email,
        full_name
      },
      // Return access token for immediate use (short-lived token)
      accessToken: data.session?.access_token
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

    // Set secure cookies with tokens
    setAuthCookies(res, data.session.access_token, data.session.refresh_token);

    logger.info(`User logged in successfully: ${email}`);
    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || ''
      },
      // Return access token for immediate use (short-lived token)
      accessToken: data.session.access_token
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Login process failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}

// POST /api/v1/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;

    if (!user) {
      logger.warn('Logout attempt without authentication');
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Invalidate the session on Supabase
    await withRetry(
      () => supabase.auth.signOut(),
      { operationName: 'User logout' }
    );

    // Clear auth cookies
    clearAuthCookies(res);

    logger.info(`User logged out: ${user.email}`);
    res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Logout process failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
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

// POST /api/v1/auth/refresh
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // The refreshTokens function handles all the token refresh logic
    // It reads the refresh token from cookies and sets new cookies with the refreshed tokens
    const refreshed = await refreshTokens(req, res);
    
    if (!refreshed) {
      res.status(401).json({ message: 'Failed to refresh token. Please log in again.' });
      return;
    }
    
    // Success, return minimal response as the cookies are already set
    res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Token refresh failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}

// POST /api/v1/auth/reset-password/request
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    
    logger.info(`Password reset requested for email: ${email}`);
    
    // Send password reset email via Supabase
    const { error } = await withRetry(
      () => supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      }),
      { operationName: 'Request password reset' }
    );
    
    if (error) {
      logger.warn(`Password reset request failed for email: ${email}`, { error: error.message });
      // For security reasons, don't reveal whether the email exists or not
      res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly.' });
      return;
    }
    
    logger.info(`Password reset email sent to: ${email}`);
    res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link shortly.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Password reset request failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
}

// POST /api/v1/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters long' });
      return;
    }
    
    logger.info('Attempting to reset password');
    
    // Update password via Supabase
    const { error } = await withRetry(
      () => supabase.auth.updateUser({ password }),
      { operationName: 'Reset password' }
    );
    
    if (error) {
      logger.warn('Password reset failed', { error: error.message });
      res.status(400).json({ message: error.message });
      return;
    }
    
    logger.info('Password reset successful');
    res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Password reset failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}
