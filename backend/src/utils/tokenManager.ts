import { CookieOptions, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from './logger';

// Cookie configuration
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const SESSION_COOKIE_NAME = 'session';

// Cookie options for refresh token - HTTP only, secure, with long expiration
const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,       // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',   // Prevents CSRF
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'             // Available across the entire site
};

// Cookie options for session cookie - HTTP only, secure, with shorter expiration
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 4 * 60 * 60 * 1000, // 4 hours
  path: '/'
};

/**
 * Set auth cookies on successful login/signup
 * @param res - Express response object
 * @param accessToken - Short-lived access token
 * @param refreshToken - Long-lived refresh token
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  // Set HTTP-only secure cookie with refresh token
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshTokenCookieOptions);
  
  // Set session cookie with access token expiry info
  res.cookie(SESSION_COOKIE_NAME, 
    JSON.stringify({ 
      expires_at: Date.now() + 3600 * 1000, // 1 hour expiry for client tracking
      logged_in: true 
    }), 
    sessionCookieOptions
  );
  
  logger.debug('Auth cookies set successfully');
};

/**
 * Clear auth cookies on logout
 * @param res - Express response object
 */
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/' });
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  logger.debug('Auth cookies cleared successfully');
};

/**
 * Refresh tokens using the refresh token from cookies
 * @param req - Express request object
 * @param res - Express response object
 * @returns Whether token refresh was successful
 */
export const refreshTokens = async (req: Request, res: Response): Promise<boolean> => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  
  if (!refreshToken) {
    logger.debug('No refresh token found in cookies');
    return false;
  }
  
  try {
    // Use the refresh token to get a new access token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error || !data.session) {
      logger.warn('Failed to refresh tokens', { error: error?.message });
      clearAuthCookies(res);
      return false;
    }
    
    // Set new cookies with updated tokens
    setAuthCookies(res, data.session.access_token, data.session.refresh_token);
    logger.debug('Tokens refreshed successfully');
    return true;
  } catch (error) {
    logger.error('Error refreshing tokens', error instanceof Error ? error : undefined);
    clearAuthCookies(res);
    return false;
  }
};

/**
 * Extract the current token from request
 * Checks both the Authorization header and cookies
 * @param req - Express request object
 * @returns The access token if found, null otherwise
 */
export const extractToken = (req: Request): string | null => {
  // First try to get from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7); // Remove 'Bearer ' prefix
  }
  
  // If not in header, attempt to get from cookie
  const sessionCookie = req.cookies[SESSION_COOKIE_NAME];
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      if (session && session.logged_in) {
        // If session exists but token not present, client should attempt refresh
        return 'refresh_needed';
      }
    } catch (e) {
      // Invalid session cookie format
      return null;
    }
  }
  
  return null;
}; 