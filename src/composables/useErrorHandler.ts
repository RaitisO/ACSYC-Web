/**
 * useErrorHandler Composable
 *
 * Provides error handling utilities for components.
 * Automatically shows notifications, logs errors, and manages retry state.
 */

import { ref, computed } from 'vue'
import { useUiStore } from '@/stores'
import { errorService, type AppError } from '@/services/errorService'
import { logger } from '@/utils/logger'

export function useErrorHandler() {
  const uiStore = useUiStore()

  const isRetrying = ref(false)
  const lastError = ref<AppError | null>(null)
  const retryCallback = ref<(() => Promise<any>) | null>(null)

  /**
   * Handle error by showing notification and logging
   */
  const handleError = (error: any, userMessage?: string, context?: string) => {
    const appError = errorService.handleError(error, context)
    lastError.value = appError

    // Log the error with context
    logger.error(appError.message, appError.details || error, context)

    // Show notification to user
    const message = userMessage || appError.message
    uiStore.showError(message)

    return appError
  }

  /**
   * Handle success and show notification
   */
  const handleSuccess = (message: string) => {
    logger.info(message)
    uiStore.showSuccess(message)
  }

  /**
   * Retry last failed operation
   */
  const retry = async () => {
    if (!retryCallback.value) {
      logger.warn('No retry callback registered', undefined, 'useErrorHandler')
      return
    }

    isRetrying.value = true
    try {
      await retryCallback.value()
      logger.info('Retry successful')
    } catch (error) {
      handleError(error, 'Retry failed. Please try again.')
    } finally {
      isRetrying.value = false
    }
  }

  /**
   * Register a callback function to be retried
   */
  const registerRetry = (callback: () => Promise<any>) => {
    retryCallback.value = callback
  }

  /**
   * Check if last error is retryable
   */
  const canRetry = computed(() => {
    return lastError.value?.retryable ?? false
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    lastError.value = null
    retryCallback.value = null
    isRetrying.value = false
  }

  return {
    handleError,
    handleSuccess,
    retry,
    registerRetry,
    clearError,
    isRetrying,
    lastError,
    canRetry,
  }
}
