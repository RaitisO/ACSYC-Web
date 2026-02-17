/**
 * Error Service
 *
 * Standardizes error handling across the application.
 * Converts different error types (network, API, validation) into consistent
 * AppError objects with user-friendly messages.
 */

export type ErrorType = 'network' | 'validation' | 'auth' | 'server' | 'unknown'

export interface AppError {
  type: ErrorType
  message: string // User-friendly message
  code?: string // Error code (e.g., "AUTH_INVALID_CREDENTIALS")
  statusCode?: number // HTTP status code
  details?: any // Technical details for logging
  retryable: boolean // Whether user can retry this action
}

class ErrorService {
  /**
   * Handle and normalize any error into an AppError object
   */
  handleError(error: any, context?: string): AppError {
    // Already an AppError
    if (this.isAppError(error)) {
      return error
    }

    // Axios/HTTP error
    if (error.response) {
      return this.handleHttpError(error, context)
    }

    // Network error (no response from server)
    if (error.request && !error.response) {
      return {
        type: 'network',
        message: 'Network error. Check your connection and try again.',
        code: 'NETWORK_ERROR',
        details: error.message,
        retryable: true,
      }
    }

    // Validation error
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      return {
        type: 'validation',
        message: error.message || 'Please check your input and try again.',
        code: 'VALIDATION_ERROR',
        details: error.details,
        retryable: false,
      }
    }

    // Fallback for unknown errors
    return {
      type: 'unknown',
      message: error.message || 'Something went wrong. Please try again.',
      code: 'UNKNOWN_ERROR',
      details: error,
      retryable: false,
    }
  }

  /**
   * Handle HTTP/API errors specifically
   */
  private handleHttpError(error: any, context?: string): AppError {
    const status = error.response.status
    const data = error.response.data

    // 401 Unauthorized
    if (status === 401) {
      return {
        type: 'auth',
        message: 'Your session has expired. Please log in again.',
        code: 'AUTH_EXPIRED',
        statusCode: 401,
        details: { context, error: data },
        retryable: false,
      }
    }

    // 403 Forbidden
    if (status === 403) {
      return {
        type: 'auth',
        message: 'You do not have permission to perform this action.',
        code: 'AUTH_FORBIDDEN',
        statusCode: 403,
        details: { context, error: data },
        retryable: false,
      }
    }

    // 404 Not Found
    if (status === 404) {
      return {
        type: 'server',
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        statusCode: 404,
        details: { context, error: data },
        retryable: false,
      }
    }

    // 422 Unprocessable Entity (validation error)
    if (status === 422) {
      return {
        type: 'validation',
        message: data.message || 'Please check your input and try again.',
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        details: { context, errors: data.errors },
        retryable: false,
      }
    }

    // 429 Too Many Requests
    if (status === 429) {
      return {
        type: 'server',
        message: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        statusCode: 429,
        details: { context, error: data },
        retryable: true,
      }
    }

    // 500+ Server errors
    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again in a moment.',
        code: 'SERVER_ERROR',
        statusCode: status,
        details: { context, error: data },
        retryable: true,
      }
    }

    // Any other HTTP error
    return {
      type: 'server',
      message: data.message || `Request failed with status ${status}`,
      code: `HTTP_${status}`,
      statusCode: status,
      details: { context, error: data },
      retryable: status >= 500, // Retryable if server error
    }
  }

  /**
   * Check if error is already an AppError
   */
  private isAppError(error: any): error is AppError {
    return (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      'message' in error &&
      'retryable' in error
    )
  }

  /**
   * Get user-facing message from error
   */
  getMessage(error: any): string {
    const appError = this.isAppError(error) ? error : this.handleError(error)
    return appError.message
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    const appError = this.isAppError(error) ? error : this.handleError(error)
    return appError.retryable
  }

  /**
   * Check if error is auth-related
   */
  isAuthError(error: any): boolean {
    const appError = this.isAppError(error) ? error : this.handleError(error)
    return appError.type === 'auth'
  }
}

export const errorService = new ErrorService()
