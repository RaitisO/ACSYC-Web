import { ref, computed } from 'vue'
import { apiService, errorService } from '@/services'
import { useRegistrationStore } from '@/stores/registrationStore'
import { logger } from '@/utils/logger'
import type { VerificationResponse, PasswordSetupResponse } from '@/types/registration'

/**
 * useVerification Composable
 *
 * Handles email verification and password setup workflow.
 *
 * Features:
 * - Verify email tokens
 * - Validate token expiration and existence
 * - Set password for verified applications
 * - Manage verification state and errors
 *
 * Usage:
 *   const { verifyToken, setPassword, isVerified } = useVerification()
 *   await verifyToken(token)
 *   await setPassword(password, confirmPassword)
 */
export function useVerification() {
  const store = useRegistrationStore()
  const isLoading = ref(false)
  const isVerifying = ref(false)
  const error = ref('')
  const successMessage = ref('')
  const applicationId = ref<string | null>(null)

  const isVerified = computed(() => store.isTokenValid)

  /**
   * Verify email token from verification link
   * @param token Verification token from URL
   * @returns Verification response with application ID
   */
  const verifyToken = async (token: string) => {
    isVerifying.value = true
    error.value = ''
    successMessage.value = ''

    try {
      if (!token || token.trim() === '') {
        throw new Error('Invalid verification token')
      }

      logger.info('Verifying email token', undefined, 'useVerification')
      
      const response = await apiService.post<VerificationResponse>(
        '/api/registration/verify-email',
        { token: token.trim() }
      )

      if (response.data.success && response.data.token_valid) {
        store.setIsTokenValid(true)
        store.setApprovedApplicationId(response.data.application_id)
        applicationId.value = response.data.application_id
        successMessage.value = response.data.message
        
        logger.info(
          'Email verification successful',
          { applicationId: response.data.application_id },
          'useVerification'
        )

        return response.data
      } else {
        throw new Error(response.data.message || 'Token verification failed')
      }
    } catch (err) {
      const appError = errorService.handleError(err, 'useVerification')
      error.value = appError.message || 'Failed to verify email token'
      
      logger.error('Email verification failed', { error: appError }, 'useVerification')
      throw appError
    } finally {
      isVerifying.value = false
    }
  }

  /**
   * Set password for verified application
   * @param password New password
   * @param confirmPassword Password confirmation
   * @returns Password setup response with user details
   */
  const setPassword = async (password: string, confirmPassword: string) => {
    isLoading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      // Basic validation
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!applicationId.value && !store.approvedApplicationId) {
        throw new Error('No verified application found. Please verify your email first.')
      }

      const appId = applicationId.value || store.approvedApplicationId

      logger.info('Setting password for application', { applicationId: appId }, 'useVerification')
      
      const response = await apiService.post<PasswordSetupResponse>(
        `/api/registration/${appId}/set-password`,
        {
          password: password,
          password_confirm: confirmPassword,
        }
      )

      if (response.data.success) {
        successMessage.value = response.data.message
        
        logger.info(
          'Password set successfully',
          { userId: response.data.user_id },
          'useVerification'
        )

        return response.data
      } else {
        throw new Error(response.data.message || 'Failed to set password')
      }
    } catch (err) {
      const appError = errorService.handleError(err, 'useVerification')
      error.value = appError.message || 'Failed to set password'
      
      logger.error('Password setup failed', { error: appError }, 'useVerification')
      throw appError
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Check if token has expired
   * Simple client-side check - backend validates for real
   */
  const isTokenExpired = computed(() => {
    // This is a placeholder - actual expiration checked on backend
    return false
  })

  /**
   * Clear verification state (for retrying)
   */
  const clearVerification = () => {
    store.setIsTokenValid(false)
    store.setApprovedApplicationId(null)
    applicationId.value = null
    error.value = ''
    successMessage.value = ''
  }

  /**
   * Reset all verification state (logout scenario)
   */
  const resetVerification = () => {
    clearVerification()
    isLoading.value = false
    isVerifying.value = false
  }

  return {
    isLoading,
    isVerifying,
    error,
    successMessage,
    applicationId,
    isVerified,
    isTokenExpired,
    verifyToken,
    setPassword,
    clearVerification,
    resetVerification,
  }
}
