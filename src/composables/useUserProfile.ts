import { ref } from 'vue'
import { apiService, userService } from '@/services'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  role: string
}

interface PasswordChangeRequest {
  old_password: string
  new_password: string
  confirm_password: string
}

/**
 * useUserProfile Composable
 *
 * Manages user profile data and operations:
 * - Fetch profile
 * - Update profile fields
 * - Change password
 * - Format sensitive data for display
 *
 * REPLACES ProfileSection.vue logic:
 * - fetchProfile() (lines 18-26)
 * - updateProfile() (lines 28-48)
 * - changePassword() (lines 50-87)
 * - formatPhone() (lines 105-117)
 * - formatEmail() (lines 105-117)
 * (Total: 95 lines of logic)
 *
 * Also handles:
 * - Loading/error states
 * - Message notifications
 * - Edit mode management
 * - Validation
 *
 * Usage examples:
 *
 * 1. Load and display profile:
 *    const { profile, isLoading, fetchProfile } = useUserProfile()
 *    onMounted(() => fetchProfile())
 *    In template: {{ profile.first_name }}
 *
 * 2. Update profile:
 *    const { profile, updateProfile, message } = useUserProfile()
 *    profile.first_name = 'New Name'
 *    await updateProfile()
 *
 * 3. Change password:
 *    const { changePassword, message } = useUserProfile()
 *    await changePassword({
 *      old_password: 'old123',
 *      new_password: 'new456',
 *      confirm_password: 'new456'
 *    })
 *
 * 4. Format for display (masks sensitive data):
 *    const { formatPhoneForDisplay, formatEmailForDisplay } = useUserProfile()
 *    {{ formatPhoneForDisplay(profile.phone) }} // Outputs: ••• ••• 1234
 */

export function useUserProfile() {
  // Profile data
  const profile = ref<UserProfile>({
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    role: '',
  })

  // UI state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const isEditing = ref(false)
  const showPasswordForm = ref(false)

  // Password form
  const passwordForm = ref<PasswordChangeRequest>({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  /**
   * Fetch user profile from backend
   */
  const fetchProfile = async () => {
    isLoading.value = true
    error.value = null

    try {
      const data = await apiService.get('/profile')
      profile.value = data.profile
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      error.value = err?.message || 'Failed to load profile'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update user profile
   * Validates required fields before sending
   */
  const updateProfile = async () => {
    // Validation
    if (!profile.value.first_name.trim() || !profile.value.last_name.trim()) {
      error.value = 'First name and last name are required'
      return
    }

    isLoading.value = true
    error.value = null
    successMessage.value = null

    try {
      await apiService.put('/profile', {
        first_name: profile.value.first_name,
        last_name: profile.value.last_name,
        phone: profile.value.phone,
        date_of_birth: profile.value.date_of_birth,
      })

      successMessage.value = 'Profile updated successfully'
      isEditing.value = false

      // Auto-clear success message
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      error.value = err?.message || 'Failed to update profile'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Change user password
   * - Validates all fields are provided
   * - Checks minimum password length
   * - Verifies passwords match
   */
  const changePassword = async (newPasswordForm?: PasswordChangeRequest) => {
    const form = newPasswordForm || passwordForm.value

    // Validation
    if (!form.old_password || !form.new_password || !form.confirm_password) {
      error.value = 'All password fields are required'
      return
    }

    if (form.new_password.length < 8) {
      error.value = 'New password must be at least 8 characters long'
      return
    }

    if (form.new_password !== form.confirm_password) {
      error.value = 'New passwords do not match'
      return
    }

    isLoading.value = true
    error.value = null
    successMessage.value = null

    try {
      const response = await fetch('http://localhost:8080/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      successMessage.value = 'Password changed successfully'
      showPasswordForm.value = false

      // Reset form
      passwordForm.value = {
        old_password: '',
        new_password: '',
        confirm_password: '',
      }

      // Auto-clear success message
      setTimeout(() => {
        successMessage.value = null
      }, 3000)
    } catch (err: any) {
      console.error('Error changing password:', err)
      error.value = err?.message || 'Failed to change password'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Format phone number for display
   * Masks all but last 4 digits
   * Example: "1234567890" -> "••• ••• 7890"
   */
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return 'Not set'
    if (phone.length <= 4) return phone
    return '••• ••• ' + phone.slice(-4)
  }

  /**
   * Format email for display
   * Masks everything after first 2 characters
   * Example: "user@example.com" -> "us•••@example.com"
   */
  const formatEmailForDisplay = (email: string): string => {
    if (!email) return ''
    const [local, domain] = email.split('@')
    if (local.length <= 2) return email
    return local.slice(0, 2) + '•••' + '@' + domain
  }

  /**
   * Cancel editing and revert changes
   * Reloads original profile from backend
   */
  const cancelEdit = async () => {
    isEditing.value = false
    await fetchProfile() // Reload original data
  }

  /**
   * Cancel password change
   */
  const cancelPasswordChange = () => {
    showPasswordForm.value = false
    passwordForm.value = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear success message
   */
  const clearSuccess = () => {
    successMessage.value = null
  }

  /**
   * Reset to initial state
   */
  const reset = async () => {
    profile.value = {
      id: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      date_of_birth: '',
      role: '',
    }
    error.value = null
    successMessage.value = null
    isEditing.value = false
    showPasswordForm.value = false
    passwordForm.value = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
  }

  return {
    // Profile data
    profile,
    passwordForm,

    // State
    isLoading,
    error,
    successMessage,
    isEditing,
    showPasswordForm,

    // Profile methods
    fetchProfile,
    updateProfile,
    changePassword,
    cancelEdit,
    cancelPasswordChange,

    // Display formatting
    formatPhoneForDisplay,
    formatEmailForDisplay,

    // Message management
    clearError,
    clearSuccess,

    // Reset
    reset,
  }
}
