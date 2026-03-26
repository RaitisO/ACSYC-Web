<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVerification } from '@/composables/useVerification'
import { useRegistrationStore } from '@/stores/registrationStore'
import TokenValidator from '@/components/Registration/TokenValidator.vue'
import FormInput from '@/components/Registration/FormInput.vue'
import '../../styles/registration.css'

const router = useRouter()
const route = useRoute()
const store = useRegistrationStore()
const {
  verifyToken,
  setPassword,
  isVerifying,
  isLoading,
  error,
  successMessage,
  isVerified,
  clearVerification,
} = useVerification()

const token = ref<string>('')
const step = ref<'verification' | 'password'>('verification')
const password = ref('')
const confirmPassword = ref('')
const passwordErrors = ref<Record<string, string>>({})

onMounted(async () => {
  // Get token from URL
  token.value = (route.query.token as string) || ''

  if (token.value) {
    try {
      // Verify the token
      await verifyToken(token.value)
      // If successful, stay on verification step briefly then move to password
      setTimeout(() => {
        step.value = 'password'
      }, 1500)
    } catch (err) {
      // Error is handled in composable and shown in TokenValidator
      step.value = 'verification'
    }
  }
})

const validatePasswordForm = (): boolean => {
  passwordErrors.value = {}
  let isValid = true

  if (!password.value || password.value.length < 8) {
    passwordErrors.value.password = 'Password must be at least 8 characters'
    isValid = false
  }

  if (!confirmPassword.value) {
    passwordErrors.value.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    passwordErrors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const handleSetPassword = async () => {
  if (!validatePasswordForm()) {
    return
  }

  try {
    await setPassword(password.value, confirmPassword.value)

    // Show success and redirect to login
    setTimeout(() => {
      // Clear registration data
      store.resetForm()
      router.push('/login')
    }, 2000)
  } catch (err) {
    // Error is handled in composable
  }
}

const handleRetry = () => {
  clearVerification()
  password.value = ''
  confirmPassword.value = ''
  passwordErrors.value = {}
  step.value = 'verification'
}

const goHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}

const handleTokenValid = (validToken: string) => {
  token.value = validToken
  setTimeout(() => {
    step.value = 'password'
  }, 1500)
}
</script>

<template>
  <div class="verification-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <!-- Header -->
    <div class="verification-header">
      <h1>Complete Your Registration</h1>
      <p>Set up your password to finish creating your account</p>
    </div>

    <div class="verification-content">
      <!-- Step 1: Token Validation -->
      <div v-if="step === 'verification'" class="verification-step">
        <TokenValidator :token="token" @tokenValid="handleTokenValid" @tokenInvalid="handleRetry" />

        <!-- Error state with retry option -->
        <div v-if="error && !isVerifying" class="verification-error">
          <p>{{ error }}</p>
          <button @click="handleRetry" class="btn btn--primary">
            Try Again with New Link
          </button>
          <p class="error-hint">
            Don't have a verification link?
            <a @click="goToLogin" class="link">Request a new one</a>
          </p>
        </div>
      </div>

      <!-- Step 2: Password Setup -->
      <div v-if="step === 'password' && isVerified" class="verification-step">
        <h2>Set Your Password</h2>
        <p class="step-description">Create a secure password to complete your registration.</p>

        <!-- Error Message -->
        <div v-if="error" class="alert alert--error">
          <span class="alert-icon">✕</span>
          <span class="alert-message">{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert--success">
          <span class="alert-icon">✓</span>
          <span class="alert-message">{{ successMessage }}</span>
          <p class="alert-subtitle">Redirecting to login...</p>
        </div>

        <!-- Form -->
        <form v-if="!successMessage" @submit.prevent="handleSetPassword" class="password-form">
          <FormInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter a secure password"
            hint="At least 8 characters with uppercase, lowercase, and numbers"
            required
          />

          <div v-if="passwordErrors.password" class="form-error">
            {{ passwordErrors.password }}
          </div>

          <FormInput
            v-model="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            required
          />

          <div v-if="passwordErrors.confirmPassword" class="form-error">
            {{ passwordErrors.confirmPassword }}
          </div>

          <div class="password-requirements">
            <p class="requirements-title">Password Requirements:</p>
            <ul>
              <li :class="{ met: password.length >= 8 }">At least 8 characters</li>
              <li :class="{ met: /[A-Z]/.test(password) }">Uppercase letter (A-Z)</li>
              <li :class="{ met: /[a-z]/.test(password) }">Lowercase letter (a-z)</li>
              <li :class="{ met: /\d/.test(password) }">Number (0-9)</li>
            </ul>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn--success" :disabled="isLoading">
              {{ isLoading ? 'Setting Password...' : 'Complete Registration' }}
            </button>

            <button
              type="button"
              @click="handleRetry"
              class="btn btn--secondary"
              :disabled="isLoading"
            >
              Back to Verification
            </button>
          </div>
        </form>
      </div>

      <!-- Not Verified State -->
      <div v-if="!isVerified && !isVerifying && step === 'verification'" class="not-verified-state">
        <div class="error-icon">✕</div>
        <h3>Verification Link Invalid or Expired</h3>
        <p>The verification link may have expired or is no longer valid.</p>

        <div class="action-buttons">
          <button @click="goToLogin" class="btn btn--primary">
            Request New Verification Email
          </button>
          <button @click="goHome" class="btn btn--secondary">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verification-error {
  text-align: center;
  padding: 2rem;
  background-color: #fff5f5;
  border-radius: 8px;
  border: 1px solid #fdd;
  margin-top: 2rem;
}

.verification-error p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.error-hint {
  font-size: 0.9rem;
  color: #999;
}

.link {
  color: #38aad9;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.not-verified-state {
  text-align: center;
  padding: 3rem 2rem;
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 auto 1.5rem;
}

.not-verified-state h3 {
  margin: 1rem 0;
  color: #333;
  font-size: 1.3rem;
}

.not-verified-state p {
  color: #666;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.password-form {
  margin-top: 2rem;
}

.password-requirements {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 4px;
  margin: 1.5rem 0;
}

.requirements-title {
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.9rem;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  padding: 0.4rem 0;
  color: #999;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.password-requirements li:before {
  content: '✗';
  color: #e74c3c;
  font-weight: 700;
  width: 20px;
}

.password-requirements li.met {
  color: #27ae60;
}

.password-requirements li.met:before {
  content: '✓';
  color: #27ae60;
}

.alert-subtitle {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
