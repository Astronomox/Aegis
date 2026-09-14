/**
 * Centralized logging utility for error tracking and monitoring
 * In production, integrate with services like Sentry, DataDog, or LogRocket
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, userId, requestId } = entry;
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const userStr = userId ? ` | User: ${userId}` : '';
    const requestStr = requestId ? ` | Request: ${requestId}` : '';
    return `[${timestamp}] ${level}: ${message}${userStr}${requestStr}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
        if (!this.isProduction) console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        // In production, send to error tracking service
        if (this.isProduction) {
          this.sendToErrorTracking(entry);
        }
        break;
    }
  }

  private async sendToErrorTracking(entry: LogEntry) {
    // Integrate with error tracking service here
    // Example: Sentry.captureException(new Error(entry.message), { extra: entry.context });
    // For now, we'll just log to stderr
    console.error('[ERROR TRACKING]', JSON.stringify(entry));
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, context);
  }

  // API-specific logging helpers
  logApiRequest(method: string, path: string, userId?: string) {
    this.info(`API Request: ${method} ${path}`, { userId });
  }

  logApiError(method: string, path: string, error: unknown, userId?: string) {
    this.error(`API Error: ${method} ${path}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });
  }

  logAuthEvent(event: string, userId?: string, context?: Record<string, unknown>) {
    this.info(`Auth Event: ${event}`, { userId, ...context });
  }

  logDatabaseOperation(operation: string, table: string, context?: Record<string, unknown>) {
    this.debug(`DB Operation: ${operation} on ${table}`, context);
  }
}

export const logger = new Logger();
