import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { withRetry } from '../utils/supabaseRetry';
import { logger } from '../utils/logger';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set.');
}

// Create a lightweight Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Authentication failed: Missing authorization header');
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  logger.debug('Verifying user token');

  try {
    const { data: { user }, error } = await withRetry(
      () => supabase.auth.getUser(token),
      { operationName: 'Token verification' }
    );

    if (error || !user) {
      logger.warn('Authentication failed: Invalid token', { error: error?.message });
      res.status(401).json({ message: 'Invalid or expired token.' });
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
}
