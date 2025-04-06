/**
 * Simple logger utility for the application
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Set the minimum log level based on environment
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

// Log level priorities
const LOG_PRIORITIES = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Logger class to handle logging with different levels
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_PRIORITIES[level] >= LOG_PRIORITIES[MIN_LOG_LEVEL];
  }

  /**
   * Log a debug message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }

  /**
   * Log an info message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  warn(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param error - The error object
   * @param meta - Additional metadata
   */
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error || '', meta || '');
    }
  }
}

// Export a singleton instance
export const logger = new Logger(); 