/**
 * Utility to retry AWS API calls with timeout support, tailored for AWS error types
 */
import { logger } from './logger';
import { ServiceException } from '@aws-sdk/smithy-client';

// Configuration options for the retry mechanism
export interface AwsRetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  operationName?: string; // For logging purposes
  retryableErrors?: string[]; // AWS error codes that should trigger retries
}

// Default configuration
const DEFAULT_OPTIONS: Required<Omit<AwsRetryOptions, 'operationName' | 'retryableErrors'>> = {
  maxRetries: 3,
  timeoutMs: 10000, // 10 seconds timeout
  retryDelayMs: 1000, // 1 second delay between retries
};

// Default AWS error codes that should be retried
const DEFAULT_RETRYABLE_ERRORS = [
  'ThrottlingException',
  'RequestTimeout',
  'RequestTimeoutException',
  'InternalError',
  'InternalServerError',
  'ServiceUnavailable',
  'ServiceUnavailableException',
  'SlowDown',
  'TooManyRequestsException',
  'ProvisionedThroughputExceededException',
  'NetworkingError'
];

/**
 * Check if an AWS error should be retried
 * @param error - The error to check
 * @param retryableErrors - List of error codes that should be retried
 * @returns Whether the error is retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  // Network errors
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return true;
  }

  // Specific AWS errors
  if (error instanceof ServiceException) {
    return retryableErrors.includes(error.name);
  }

  return false;
}

/**
 * Executes an AWS operation with retry logic and timeout
 * @param operation - The AWS operation to execute
 * @param options - Retry configuration options
 * @returns The result of the AWS operation
 */
export async function withAwsRetry<T>(
  operation: () => Promise<T>,
  options: AwsRetryOptions = {}
): Promise<T> {
  const { 
    operationName = 'AWS operation',
    retryableErrors = DEFAULT_RETRYABLE_ERRORS,
    ...restOptions 
  } = options;
  
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
      
      // Log error details
      if (error instanceof ServiceException) {
        logger.warn(`${operationName} failed (attempt ${attempt}/${config.maxRetries})`, { 
          errorName: error.name,
          errorMessage: error.message,
          attempt,
          maxRetries: config.maxRetries
        });
      } else {
        logger.warn(`${operationName} failed (attempt ${attempt}/${config.maxRetries})`, { 
          error: lastError.message,
          attempt,
          maxRetries: config.maxRetries
        });
      }
      
      // If this is the last attempt, don't wait
      if (attempt === config.maxRetries) {
        logger.error(`${operationName} failed after ${config.maxRetries} retries`, lastError);
        break;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        logger.info(`${operationName} failed with non-retryable error, not retrying further`, {
          error: lastError.message
        });
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelayMs));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after multiple retries`);
} 