<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '@/services/api'
import { useUserStore } from '@/stores'
import '../styles/components/force-password-change-modal.css'

const router = useRouter()
const userStore = useUserStore()

// Form state
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Password validation
const passwordStrength = ref(0)
const passwordErrors = ref<string[]>([])

const validatePassword = (pwd: string) => {
  passwordErrors.value = []
  let strength = 0

  if (pwd.length >= 8) {
    strength += 25
  } else {
    passwordErrors.value.push('At least 8 characters')
  }

  if (/[A-Z]/.test(pwd)) {
    strength += 25
  } else {
    passwordErrors.value.push('At least 1 uppercase letter')
  }

  if (/[0-9]/.test(pwd)) {
    strength += 25
  } else {
    passwordErrors.value.push('At least 1 number')
  }

  if (/[!@#$%^&*]/.test(pwd)) {
    strength += 25
  } else {
    passwordErrors.value.push('At least 1 special character (!@#$%^&*)')
  }

  passwordStrength.value = strength
}

const handlePasswordInput = () => {
  validatePassword(password.value)
  errorMessage.value = ''
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleChangePassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Validation
  if (!password.value) {
    errorMessage.value = 'Password is required'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (passwordStrength.value < 100) {
    errorMessage.value = 'Password does not meet security requirements'
    return
  }

  isLoading.value = true

  try {
    console.log('[ForcePasswordChangeModal] Calling set-initial-password endpoint')
    const response = await apiService.post('/set-initial-password', {
      new_password: password.value,
      confirm_password: confirmPassword.value,
    })

    console.log('[ForcePasswordChangeModal] Response:', response)
    successMessage.value = 'Password set successfully! Redirecting to dashboard...'

    // Wait a moment for the user to see the message, then redirect
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error: any) {
    console.error('[ForcePasswordChangeModal] Error setting password:', error)
    errorMessage.value = error.message || 'Failed to set password'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Check if user is authenticated
  if (!userStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>

<template>
  <div class="force-password-change-container">
    <div class="password-change-card">
      <div class="header">
        <h1>Set Your Password</h1>
        <p>Please create a strong password for your account</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- Password Input -->
      <div class="form-group">
        <label for="password">New Password</label>
        <div class="input-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="password"
            v-model="password"
            placeholder="Enter a strong password"
            @input="handlePasswordInput"
          />
          <button
            type="button"
            class="toggle-password"
            @click="togglePasswordVisibility"
            :title="showPassword ? 'Hide password' : 'Show password'"
          >
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>

        <!-- Password Strength Indicator -->
        <div class="strength-indicator" v-if="password">
          <div class="strength-bar">
            <div
              class="strength-fill"
              :style="{ width: passwordStrength + '%' }"
            ></div>
          </div>
          <div
            :class="[
              'strength-text',
              passwordStrength < 50 ? 'weak' : passwordStrength < 100 ? 'medium' : 'strong',
            ]"
          >
            {{
              passwordStrength < 50
                ? '❌ Weak'
                : passwordStrength < 100
                  ? '⚠️ Medium'
                  : '✅ Strong'
            }}
          </div>
        </div>

        <!-- Requirements Checklist -->
        <div class="requirements" v-if="password">
          <h4>Password Requirements:</h4>
          <div class="requirement-item">
            <span
              :class="[
                'requirement-icon',
                password.length >= 8 ? 'requirement-met' : 'requirement-unmet',
              ]"
            >
              {{ password.length >= 8 ? '✓' : '○' }}
            </span>
            <span>At least 8 characters</span>
          </div>
          <div class="requirement-item">
            <span
              :class="[
                'requirement-icon',
                /[A-Z]/.test(password) ? 'requirement-met' : 'requirement-unmet',
              ]"
            >
              {{ /[A-Z]/.test(password) ? '✓' : '○' }}
            </span>
            <span>At least 1 uppercase letter (A-Z)</span>
          </div>
          <div class="requirement-item">
            <span
              :class="[
                'requirement-icon',
                /[0-9]/.test(password) ? 'requirement-met' : 'requirement-unmet',
              ]"
            >
              {{ /[0-9]/.test(password) ? '✓' : '○' }}
            </span>
            <span>At least 1 number (0-9)</span>
          </div>
          <div class="requirement-item">
            <span
              :class="[
                'requirement-icon',
                /[!@#$%^&*]/.test(password) ? 'requirement-met' : 'requirement-unmet',
              ]"
            >
              {{ /[!@#$%^&*]/.test(password) ? '✓' : '○' }}
            </span>
            <span>At least 1 special character (!@#$%^&*)</span>
          </div>
        </div>
      </div>

      <!-- Confirm Password Input -->
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <div class="input-wrapper">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            id="confirm-password"
            v-model="confirmPassword"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            class="toggle-password"
            @click="toggleConfirmPasswordVisibility"
            :title="showConfirmPassword ? 'Hide password' : 'Show password'"
          >
            {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <div v-if="confirmPassword && password !== confirmPassword" class="error-text">
          Passwords do not match
        </div>
        <div v-else-if="confirmPassword && password === confirmPassword" class="success-text">
          Passwords match ✓
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="button"
        class="submit-btn"
        @click="handleChangePassword"
        :disabled="
          !(password &&
            confirmPassword &&
            passwordStrength === 100 &&
            password === confirmPassword) || isLoading
        "
      >
        {{ isLoading ? 'Setting password...' : 'Set Password' }}
      </button>
    </div>
  </div>
</template>
