import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';    

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set.');
}

// Create a lightweight Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ message: 'Invalid or expired token.' });
    return;
  }

  // Attach user to res.locals
  res.locals.user = user;
  next();
}
