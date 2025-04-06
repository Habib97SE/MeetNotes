/**
 * Utility to retry Supabase API calls with timeout support
 */
import { logger } from './logger';

// Configuration options for the retry mechanism
export interface RetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  operationName?: string; // For logging purposes
}

// Default configuration
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'operationName'>> = {
  maxRetries: 3,
  timeoutMs: 10000, // 10 seconds timeout
  retryDelayMs: 1000, // 1 second delay between retries
};

/**
 * Executes a Supabase operation with retry logic and timeout
 * @param operation - The Supabase operation to execute
 * @param options - Retry configuration options
 * @returns The result of the Supabase operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { operationName = 'Supabase operation', ...restOptions } = options;
  const config = { ...DEFAULT_OPTIONS, ...restOptions };
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        logger.info(`Retry attempt ${attempt}/${config.maxRetries} for ${operationName}`);
      }
      
      // Create a promise that resolves with the operation result
      const operationPromise = operation();
      
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${config.timeoutMs}ms`));
        }, config.timeoutMs);
      });
      
      // Race the operation against the timeout
      const result = await Promise.race([operationPromise, timeoutPromise]);
      
      if (attempt > 1) {
        logger.info(`Successfully completed ${operationName} after ${attempt} attempts`);
      }
      
      return result as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`${operationName} failed (attempt ${attempt}/${config.maxRetries})`, { 
        error: lastError.message,
        attempt,
        maxRetries: config.maxRetries
      });
      
      // If this is the last attempt, don't wait
      if (attempt === config.maxRetries) {
        logger.error(`${operationName} failed after ${config.maxRetries} retries`, lastError);
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelayMs));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after multiple retries`);
} 