<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFormValidation, ValidationRules } from '@/composables/useFormValidation'
import { authService } from '@/services'
import { useUserStore } from '@/stores'
import '../../styles/views/auth.css'

const router = useRouter()
const userStore = useUserStore()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const errorDetails = ref('')
const approvalStatus = ref<'pending' | 'rejected' | null>(null)
const isLoading = ref(false)

// Form validation
const { registerField, validateField, validateForm, setFieldValue } = useFormValidation()

onMounted(() => {
  // Check if user is already logged in
  if (userStore.isAuthenticated) {
    router.push('/dashboard')
  }

  // Register validation fields
  registerField('email', '', [
    ValidationRules.required('Email'),
    ValidationRules.email,
  ])
  registerField('password', '', [ValidationRules.required('Password')])
})

const handleLogin = async () => {
  errorMessage.value = ''
  errorDetails.value = ''
  approvalStatus.value = null

  // Update field values with actual input values before validation
  setFieldValue('email', email.value)
  setFieldValue('password', password.value)

  // Validate email field
  if (!validateField('email')) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  // Validate password field
  if (!validateField('password')) {
    errorMessage.value = 'Password is required'
    return
  }

  isLoading.value = true

  try {
    const data = await authService.login(email.value, password.value)

    console.log('Login successful:', data)
    // Store user in both userStore and localStorage
    userStore.login(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Login error:', error)

    // Handle approval status errors
    if (error.response?.data?.status === 'pending') {
      approvalStatus.value = 'pending'
      errorMessage.value = 'Application Pending Approval'
      errorDetails.value = error.response?.data?.message || 'Your application is pending admin approval. You will be able to log in once it has been reviewed.'
    } else if (error.response?.data?.status === 'rejected') {
      approvalStatus.value = 'rejected'
      errorMessage.value = 'Application Rejected'
      errorDetails.value = error.response?.data?.message || 'Your application has been rejected. Please contact support for more information.'
    } else {
      errorMessage.value = error.message || 'Login failed. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const goHome = () => {
  router.push('/')
}
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="login-card">
      <h1>Welcome Back</h1>

      <!-- Error Message -->
      <div v-if="errorMessage" :class="['error-message', { 'pending': approvalStatus === 'pending', 'rejected': approvalStatus === 'rejected' }]">
        <div class="error-title">{{ errorMessage }}</div>
        <div v-if="errorDetails" class="error-details">{{ errorDetails }}</div>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="Enter your email"
            @blur="validateField('email')"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Enter your password"
            @blur="validateField('password')"
            required
          />
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Don't have an account? <a @click="goToRegister" class="link">Sign up</a></p>
      </div>
    </div>
  </div>
</template>
