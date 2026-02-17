<script setup lang="ts">
import { ref, onMounted, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores'
import { logger } from '@/utils/logger'
import '../styles/views/layout.css'

defineOptions({
  name: 'ErrorBoundary',
})

const router = useRouter()
const uiStore = useUiStore()

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref<any>(null)
const isDev = computed(() => import.meta.env.DEV)

/**
 * Capture errors from child components
 */
onErrorCaptured((error: any, instance, info) => {
  hasError.value = true
  errorMessage.value =
    error?.message || 'An unexpected error occurred. Please try refreshing the page.'
  errorDetails.value = {
    error,
    instance: instance?.$options.name || 'Unknown Component',
    info,
  }

  // Log the error
  logger.error('Component Error Captured', errorDetails.value, 'ErrorBoundary')

  // Show notification
  uiStore.showError(errorMessage.value)

  // Return false to prevent error from propagating further
  return false
})

/**
 * Reset error and go home
 */
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = null
}

/**
 * Go back to previous page
 */
const goBack = () => {
  router.back()
  resetError()
}

/**
 * Reload page
 */
const reloadPage = () => {
  location.reload()
}

/**
 * Report error to admin (placeholder for future implementation)
 */
const reportError = async () => {
  try {
    logger.info(
      'Error reported by user',
      {
        message: errorMessage.value,
        details: errorDetails.value,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      'ErrorBoundary',
    )
    uiStore.showSuccess('Error report sent. Thank you!')
  } catch (error) {
    logger.error('Failed to report error', error, 'ErrorBoundary')
  }
}
</script>

<template>
  <div v-if="!hasError" class="error-boundary">
    <slot />
  </div>

  <!-- Error Display -->
  <div v-else class="error-boundary-display">
    <div class="error-container">
      <div class="error-icon">⚠️</div>

      <h1 class="error-title">Oops! Something Went Wrong</h1>

      <p class="error-message">
        {{ errorMessage }}
      </p>

      <div v-if="isDev" class="error-details">
        <details class="technical-details">
          <summary>Technical Details (Development Only)</summary>
          <pre>{{ JSON.stringify(errorDetails, null, 2) }}</pre>
        </details>
      </div>

      <div class="error-actions">
        <button @click="goBack" class="btn-secondary">← Go Back</button>
        <button @click="resetError" class="btn-primary">Try Again</button>
        <button @click="reloadPage" class="btn-secondary">Reload Page</button>
      </div>

      <button @click="reportError" class="btn-report">
        📧 Report This Error
      </button>

      <p class="error-support">
        If this problem persists, please contact support@acsyc.com
      </p>
    </div>
  </div>
</template>
