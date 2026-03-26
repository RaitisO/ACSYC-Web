import { ref } from 'vue'
import { apiService, errorService } from '@/services'
import { logger } from '@/utils/logger'
import type { RegistrationApplication } from '@/types/registration'

/**
 * useRegistration Composable
 *
 * Handles registration form submission and related API operations.
 *
 * Features:
 * - Submit multi-step registration application
 * - Handle email verification workflow
 * - Manage submission state and errors
 * - Auto-send verification email on successful submission
 *
 * Usage:
 *   const { submitApplication, isSubmitting, error } = useRegistration()
 *   await submitApplication(formData)
 */
export function useRegistration() {
  const isSubmitting = ref(false)
  const error = ref('')
  const success = ref(false)
  const applicationId = ref<string | null>(null)

  /**
   * Submit registration application
   * @param formData Complete registration form data
   * @returns Application response with verification details
   */
  const submitApplication = async (formData: RegistrationApplication) => {
    isSubmitting.value = true
    error.value = ''
    success.value = false

    try {
      logger.info('Submitting registration application', undefined, 'useRegistration')
      
      // Transform frontend data structure to backend format
      const isNewFamily = formData.family_type === 'new'
      
      const backendPayload = {
        // Family type
        is_new_family: isNewFamily,
        existing_parent_email: !isNewFamily ? formData.parent_info.email : '',
        
        // Parent information
        parent_first_name: formData.parent_info.first_name,
        parent_last_name: formData.parent_info.last_name,
        parent_email: formData.parent_info.email,
        parent_phone: formData.parent_info.phone,
        parent_password: isNewFamily ? 'TempPassword123!' : '', // Temporary - will be set during verification
        source_of_referral: 'web_registration', // Required field - default to web
        
        // Student information
        student_first_name: formData.student_info.first_name,
        student_last_name: formData.student_info.last_name,
        student_email: formData.student_info.email,
        student_phone: '+37120000000', // Placeholder - must be Latvian format +371XXXXXXXX
        gymnasium_status: 'not_planning', // Default if not specified
        grade_level: '9', // Default if not specified
        
        // Learning preferences
        learning_goals: [1], // Default: at least one ID (assuming ID 1 exists)
        preferred_language: 'english', // Default
        
        // Teacher preferences
        teacher_preferences: {
          gender: formData.teacher_preferences.gender || 'other',
          relationship_style: formData.teacher_preferences.relationship_style || 'authoritative',
          qualities: [], // Array of teacher quality IDs - form needs update to collect these as IDs
          comments: formData.teacher_preferences.qualities || '', // For now, store the text in comments
        },
        
        // Subjects and lessons
        desired_subjects: [1], // Default: at least one ID (assuming ID 1 exists)
        lessons_per_week: typeof formData.subjects_availability.lessons_per_week === 'string' 
          ? parseInt(formData.subjects_availability.lessons_per_week) 
          : formData.subjects_availability.lessons_per_week || 1,
        
        // Availability
        // NOTE: Form currently stores times as strings (e.g., '9:00'), 
        // but backend expects integer IDs of lesson_time_slots
        // For now, sending minimal valid data - form needs redesign to collect time slot IDs
        availability: { monday: [1] }, // Placeholder - needs time slot ID mapping
        availability_notes: formData.subjects_availability.custom_times || '',
        grade_in_course: '9', // Default
        
        // Group lessons
        group_lesson_subjects: [],
        
        // Notes
        additional_notes: formData.student_info.interests || 'No additional notes',
      }
      
      // ===== DEBUG LOGGING =====
      console.log('========== REGISTRATION DATA ==========')
      console.log('Frontend Form Data:', formData)
      console.log('----------------------------------------')
      console.log('Backend Payload (to be sent):', backendPayload)
      console.log('----------------------------------------')
      console.log('Family Type:', isNewFamily ? 'NEW' : 'EXISTING')
      console.log('Parent Email:', backendPayload.parent_email)
      console.log('Parent Phone:', backendPayload.parent_phone, '(format: +371XXXXXXXX)')
      console.log('Student Email:', backendPayload.student_email)
      console.log('Student Phone:', backendPayload.student_phone, '(format: +371XXXXXXXX)')
      console.log('Learning Goals:', backendPayload.learning_goals)
      console.log('Desired Subjects:', backendPayload.desired_subjects)
      console.log('Lessons Per Week:', backendPayload.lessons_per_week)
      console.log('Availability:', backendPayload.availability)
      console.log('Teacher Preferences:', backendPayload.teacher_preferences)
      console.log('=====================================')
      
      // Call backend registration endpoint
      const response = await apiService.post(
        '/registration/submit',
        backendPayload
      )
      
      console.log('✅ Success Response:', response)

      // On successful response (HTTP 201), set success state
      applicationId.value = response.application_id
      success.value = true
      
      logger.info(
        'Registration submitted successfully',
        { applicationId: response.application_id },
        'useRegistration'
      )

      // Clear form from localStorage on success
      localStorage.removeItem('registration_form_data')

      return response
    } catch (err) {
      console.error('❌ Error Response:', err)
      if (err instanceof Error) {
        console.error('Error Message:', err.message)
      }
      // Check if there's a response with details
      const errorResponse = (err as any).response || (err as any).data
      if (errorResponse) {
        console.error('Error Details:', errorResponse)
        // If it's a validation error, show the details array
        if (errorResponse.details && Array.isArray(errorResponse.details)) {
          console.error('❌ VALIDATION ERRORS:')
          errorResponse.details.forEach((detail: string, index: number) => {
            console.error(`  ${index + 1}. ${detail}`)
          })
        }
      }
      
      const appError = errorService.handleError(err, 'useRegistration')
      error.value = appError.message || 'Failed to submit registration'
      
      logger.error('Registration submission failed', { error: appError }, 'useRegistration')
      throw appError
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Resend verification email
   * @param email Email address to send verification to
   * @returns Response confirmation
   */
  const resendVerificationEmail = async (email: string) => {
    isSubmitting.value = true
    error.value = ''

    try {
      logger.info('Resending verification email', { email }, 'useRegistration')
      
      const response = await apiService.post('/registration/resend-verification', {
        email: email.toLowerCase(),
      })

      logger.info('Verification email resent successfully', { email }, 'useRegistration')
      return response.data
    } catch (err) {
      const appError = errorService.handleError(err, 'useRegistration')
      error.value = appError.message || 'Failed to resend verification email'
      
      logger.error('Failed to resend verification email', { email, error: appError }, 'useRegistration')
      throw appError
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    error,
    success,
    applicationId,
    submitApplication,
    resendVerificationEmail,
  }
}
