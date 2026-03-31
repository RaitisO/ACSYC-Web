<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'password-changed'): void
  (e: 'error', message: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const userStore = useUserStore()

// Form state
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Password validation
const passwordStrength = ref<'weak' | 'fair' | 'good' | 'strong'>('weak')
const passwordErrors = ref<string[]>([])

// Password validation regexes
const hasMinLength = (pwd: string) => pwd.length >= 8
const hasUppercase = (pwd: string) => /[A-Z]/.test(pwd)
const hasLowercase = (pwd: string) => /[a-z]/.test(pwd)
const hasNumber = (pwd: string) => /[0-9]/.test(pwd)
const hasSpecialChar = (pwd: string) => /[!@#$%^&*()_+=\-[\]{};:|,.<>/?]/.test(pwd)

// Calculate password strength
const updatePasswordStrength = () => {
  const pwd = newPassword.value
  passwordErrors.value = []

  if (!hasMinLength(pwd)) {
    passwordErrors.value.push('At least 8 characters required')
    passwordStrength.value = 'weak'
    return
  }

  if (!hasUppercase(pwd)) {
    passwordErrors.value.push('Include at least one uppercase letter')
  }

  if (!hasLowercase(pwd)) {
    passwordErrors.value.push('Include at least one lowercase letter')
  }

  if (!hasNumber(pwd)) {
    passwordErrors.value.push('Include at least one number')
  }

  if (!hasSpecialChar(pwd)) {
    passwordErrors.value.push('Include at least one special character (!@#$%^&*)')
  }

  // Determine strength
  if (passwordErrors.value.length === 0) {
    passwordStrength.value = 'strong'
  } else if (passwordErrors.value.length === 1 && pwd.length >= 12) {
    passwordStrength.value = 'good'
  } else if (passwordErrors.value.length <= 2 && pwd.length >= 10) {
    passwordStrength.value = 'fair'
  } else {
    passwordStrength.value = 'weak'
  }
}

const handlePasswordInput = () => {
  updatePasswordStrength()
  errorMessage.value = ''
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  if (!newPassword.value) {
    errorMessage.value = 'New password is required'
    return false
  }

  if (passwordErrors.value.length > 0) {
    errorMessage.value = 'Password does not meet security requirements'
    return false
  }

  if (!confirmPassword.value) {
    errorMessage.value = 'Please confirm your password'
    return false
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return false
  }

  return true
}

const handleChangePassword = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Call backend to update password
    await userStore.changePassword(newPassword.value)

    successMessage.value = 'Password changed successfully!'

    // Reset form
    newPassword.value = ''
    confirmPassword.value = ''
    passwordStrength.value = 'weak'
    passwordErrors.value = []

    // Wait a moment to show success message, then emit event
    setTimeout(() => {
      emit('password-changed')
    }, 1500)
  } catch (error: any) {
    console.error('Password change error:', error)
    const errorMsg = error.response?.data?.error || error.message || 'Failed to change password'
    errorMessage.value = errorMsg
    emit('error', errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

const getStrengthColor = () => {
  switch (passwordStrength.value) {
    case 'strong':
      return '#27ae60'
    case 'good':
      return '#f39c12'
    case 'fair':
      return '#e67e22'
    case 'weak':
      return '#d32f2f'
    default:
      return '#ccc'
  }
}

const getStrengthLabel = () => {
  switch (passwordStrength.value) {
    case 'strong':
      return 'Strong'
    case 'good':
      return 'Good'
    case 'fair':
      return 'Fair'
    case 'weak':
      return 'Weak'
    default:
      return 'N/A'
  }
}
</script>

<template>
  <div v-if="visible" class="password-modal-overlay">
    <div class="password-modal">
      <div class="modal-header">
        <h2>Create Your Permanent Password</h2>
        <p class="modal-subtitle">Change your temporary password to secure your account</p>
      </div>

      <div class="modal-content">
        <!-- Error Message -->
        <div v-if="errorMessage" class="alert alert-error">
          <span class="alert-icon">⚠</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert-success">
          <span class="alert-icon">✓</span>
          <span>{{ successMessage }}</span>
        </div>

        <!-- New Password Field -->
        <div class="form-group">
          <label for="new-password" class="form-label">New Password</label>
          <div class="password-input-wrapper">
            <input
              id="new-password"
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter your new password"
              :disabled="isSubmitting"
              @input="handlePasswordInput"
            />
            <button
              type="button"
              class="toggle-password-btn"
              @click="showPassword = !showPassword"
              :disabled="isSubmitting"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              {{ showPassword ? '👁' : '👁‍🗨' }}
            </button>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="newPassword" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :style="{
                  width: passwordStrength === 'weak' ? '25%' : passwordStrength === 'fair' ? '50%' : passwordStrength === 'good' ? '75%' : '100%',
                  backgroundColor: getStrengthColor(),
                }"
              ></div>
            </div>
            <p class="strength-label" :style="{ color: getStrengthColor() }">
              Strength: <strong>{{ getStrengthLabel() }}</strong>
            </p>
          </div>

          <!-- Password Requirements -->
          <div v-if="newPassword" class="password-requirements">
            <p class="requirements-title">Password Requirements:</p>
            <ul>
              <li :class="{ met: hasMinLength(newPassword), unmet: !hasMinLength(newPassword) }">
                ✓ At least 8 characters
              </li>
              <li :class="{ met: hasUppercase(newPassword), unmet: !hasUppercase(newPassword) }">
                ✓ At least one uppercase letter (A-Z)
              </li>
              <li :class="{ met: hasLowercase(newPassword), unmet: !hasLowercase(newPassword) }">
                ✓ At least one lowercase letter (a-z)
              </li>
              <li :class="{ met: hasNumber(newPassword), unmet: !hasNumber(newPassword) }">
                ✓ At least one number (0-9)
              </li>
              <li :class="{ met: hasSpecialChar(newPassword), unmet: !hasSpecialChar(newPassword) }">
                ✓ At least one special character (!@#$%^&*)
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="confirm-password" class="form-label">Confirm Password</label>
          <div class="password-input-wrapper">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Re-enter your new password"
              :disabled="isSubmitting"
            />
            <button
              type="button"
              class="toggle-password-btn"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="isSubmitting"
              :title="showConfirmPassword ? 'Hide password' : 'Show password'"
            >
              {{ showConfirmPassword ? '👁' : '👁‍🗨' }}
            </button>
          </div>

          <!-- Match Indicator -->
          <div v-if="confirmPassword && newPassword !== confirmPassword" class="match-warning">
            <span class="warning-icon">✕</span>
            <span>Passwords do not match</span>
          </div>
          <div v-if="confirmPassword && newPassword === confirmPassword" class="match-success">
            <span class="success-icon">✓</span>
            <span>Passwords match</span>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          class="submit-btn"
          @click="handleChangePassword"
          :disabled="isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword || passwordErrors.length > 0"
          :class="{ loading: isSubmitting }"
        >
          <span v-if="isSubmitting">Updating Password...</span>
          <span v-else>Update Password</span>
        </button>

        <!-- Info Box -->
        <div class="info-box">
          <p>
            <strong>💡 Tip:</strong> Use a mix of uppercase, lowercase, numbers, and special characters for a strong password.
            Your password will be used to log into your account.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.password-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  background: linear-gradient(135deg, #38aad9 0%, #9bbf19 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.modal-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.modal-content {
  padding: 2rem;
}

/* Alert Messages */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #d32f2f;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #27ae60;
}

.alert-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #38aad9;
  box-shadow: 0 0 0 3px rgba(56, 170, 217, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.toggle-password-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  transition: opacity 0.3s ease;
}

.toggle-password-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.toggle-password-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Password Strength */
.password-strength {
  margin-top: 0.75rem;
}

.strength-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 3px;
}

.strength-label {
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;
}

/* Password Requirements */
.password-requirements {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.requirements-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.password-requirements ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.password-requirements li {
  font-size: 0.85rem;
  padding: 0.35rem 0;
  color: #666;
}

.password-requirements li.met {
  color: #27ae60;
}

.password-requirements li.unmet {
  color: #d32f2f;
  opacity: 0.6;
}

/* Match Indicator */
.match-warning,
.match-success {
  font-size: 0.85rem;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.match-warning {
  color: #d32f2f;
}

.match-success {
  color: #27ae60;
}

.warning-icon,
.success-icon {
  font-weight: bold;
  font-size: 1rem;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #38aad9 0%, #9bbf19 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(56, 170, 217, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.submit-btn.loading {
  pointer-events: none;
}

/* Info Box */
.info-box {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #38aad9;
}

.info-box p {
  margin: 0;
  color: #1565c0;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .password-modal {
    margin: 1rem;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .password-requirements {
    padding: 0.75rem;
  }

  .password-requirements li {
    font-size: 0.8rem;
    padding: 0.25rem 0;
  }
}
</style>
