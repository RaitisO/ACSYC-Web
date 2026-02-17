/**
 * Logger Utility
 *
 * Provides consistent logging across the application with different levels.
 * In development: logs to console with colors
 * In production: can be extended to send to monitoring services (Sentry, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  context?: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context)
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context)
  }

  /**
   * Warn level - warning messages
   */
  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context)
  }

  /**
   * Error level - error messages
   */
  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    }

    if (this.isDevelopment) {
      this.logToConsole(entry)
    } else {
      // In production, could send to monitoring service
      this.logToService(entry)
    }
  }

  /**
   * Log to browser console with styling
   */
  private logToConsole(entry: LogEntry) {
    const { timestamp, level, message, data, context } = entry
    const prefix = context ? `[${context}]` : ''
    const timestamp_str = timestamp.split('T')[1].split('.')[0] // HH:MM:SS

    const styles = this.getConsoleStyles(level)
    const logMessage = `${timestamp_str} ${prefix} ${message}`

    if (data) {
      console.log(`%c${logMessage}`, styles, data)
    } else {
      console.log(`%c${logMessage}`, styles)
    }
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyles(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #888; font-size: 12px;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    }
    return styles[level]
  }

  /**
   * Log to external service (e.g., Sentry)
   * Can be extended in the future to send logs to monitoring service
   */
  private logToService(entry: LogEntry) {
    // Future: Send to Sentry, LogRocket, or other service
    // Example:
    // if (entry.level === 'error') {
    //   Sentry.captureException(entry.data)
    // }

    // For now, still log to console in production for debugging
    this.logToConsole(entry)
  }
}

export const logger = new Logger()
