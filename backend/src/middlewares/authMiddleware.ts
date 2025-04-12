import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { withRetry } from '../utils/supabaseRetry';
import { logger } from '../utils/logger';
import { extractToken, refreshTokens } from '../utils/tokenManager';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set.');
}

// Create a lightweight Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extract token from request (checks both header and cookies)
  const token = extractToken(req);
  
  if (!token) {
    logger.warn('Authentication failed: No valid token found');
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  // If token is refresh_needed, attempt token refresh
  if (token === 'refresh_needed') {
    logger.debug('Token refresh needed, attempting refresh');
    const refreshed = await refreshTokens(req, res);
    
    if (!refreshed) {
      logger.warn('Authentication failed: Token refresh failed');
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }
    
    // After refresh, continue with the refreshed token in the cookie
    // The client will need to retry the request with the new token
    res.status(401).json({ 
      message: 'Token refreshed. Please retry your request.',
      tokenRefreshed: true 
    });
    return;
  }
  
  logger.debug('Verifying user token');
  
  try {
    const { data: { user }, error } = await withRetry(
      () => supabase.auth.getUser(token),
      { operationName: 'Token verification' }
    );

    if (error || !user) {
      logger.warn('Authentication failed: Invalid token', { error: error?.message });
      
      // Attempt token refresh as fallback
      logger.debug('Attempting token refresh as fallback');
      const refreshed = await refreshTokens(req, res);
      
      if (!refreshed) {
        res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
        return;
      }
      
      // After refresh, client needs to retry
      res.status(401).json({ 
        message: 'Token refreshed. Please retry your request.',
        tokenRefreshed: true 
      });
      return;
    }

    // Attach user to res.locals
    res.locals.user = user;
    logger.debug(`User authenticated: ${user.email}`);
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Token verification failed', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};
