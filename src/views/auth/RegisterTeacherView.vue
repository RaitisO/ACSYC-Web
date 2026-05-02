<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService, invitationService } from '@/services'
import '../../styles/views/auth.css'

const router = useRouter()
const route = useRoute()

const invitationCode = ref(route.query.code as string || '')
const isValidating = ref(true)
const isValidCode = ref(false)
const codeError = ref('')

const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  date_of_birth: '',
  phone: '',
})

const errorMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  // Check if code exists in URL
  if (!invitationCode.value) {
    codeError.value = 'No invitation code provided'
    isValidating.value = false
    return
  }

  // Validate the invitation code
  try {
    await invitationService.validateCode(invitationCode.value)
    isValidCode.value = true
  } catch (error: any) {
    codeError.value = error.message || 'Invalid or expired invitation code'
    isValidCode.value = false
  } finally {
    isValidating.value = false
  }
})

const handleRegister = async () => {
  errorMessage.value = ''

  // Validate all fields manually
  const validationErrors: string[] = []

  // First name validation
  if (!formData.value.first_name || formData.value.first_name.trim() === '') {
    validationErrors.push('First name is required')
  } else if (!/^[a-zA-Z\s]+$/.test(formData.value.first_name)) {
    validationErrors.push('First name must contain only letters')
  }

  // Last name validation
  if (!formData.value.last_name || formData.value.last_name.trim() === '') {
    validationErrors.push('Last name is required')
  } else if (!/^[a-zA-Z\s]+$/.test(formData.value.last_name)) {
    validationErrors.push('Last name must contain only letters')
  }

  // Email validation
  if (!formData.value.email || formData.value.email.trim() === '') {
    validationErrors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    validationErrors.push('Please enter a valid email address')
  }

  // Phone validation
  if (!formData.value.phone || formData.value.phone.trim() === '') {
    validationErrors.push('Phone number is required')
  } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.value.phone)) {
    validationErrors.push('Please enter a valid phone number')
  }

  // Date of birth validation
  if (!formData.value.date_of_birth) {
    validationErrors.push('Date of birth is required')
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.value.date_of_birth)) {
    validationErrors.push('Please enter a valid date (YYYY-MM-DD)')
  } else {
    const birthDate = new Date(formData.value.date_of_birth)
    const today = new Date()
    const calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const age = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? calculatedAge - 1
      : calculatedAge
    if (age < 13) {
      validationErrors.push('You must be at least 13 years old')
    }
  }

  // Password validation
  if (!formData.value.password || formData.value.password.trim() === '') {
    validationErrors.push('Password is required')
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.value.password)) {
    validationErrors.push('Password must be at least 8 characters with uppercase, lowercase, number and special character')
  }

  // Confirm password validation
  if (!formData.value.confirmPassword || formData.value.confirmPassword.trim() === '') {
    validationErrors.push('Confirm password is required')
  }

  // Check if passwords match
  if (formData.value.password !== formData.value.confirmPassword) {
    validationErrors.push('Passwords do not match')
  }

  if (validationErrors.length > 0) {
    errorMessage.value = validationErrors.join('\n')
    return
  }

  isLoading.value = true

  try {
    // Sanitize names to prevent XSS
    const submitData = {
      code: invitationCode.value,
      first_name: String(formData.value.first_name).trim(),
      last_name: String(formData.value.last_name).trim(),
      email: String(formData.value.email).trim().toLowerCase(),
      password: formData.value.password,
      date_of_birth: formData.value.date_of_birth,
      phone: String(formData.value.phone).trim(),
    }

    await authService.registerTeacher(submitData)

    console.log('Teacher registration successful')
    // Redirect to success page
    router.push({
      name: 'register-success',
      query: { email: submitData.email },
    })
  } catch (error: any) {
    console.error('Teacher registration error:', error)
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const goHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="register-card">
      <h1>Teacher Registration</h1>

      <!-- Validating Code -->
      <div v-if="isValidating" class="loading-message">
        <p>Validating invitation code...</p>
      </div>

      <!-- Invalid Code -->
      <div v-else-if="!isValidCode" class="error-message">
        <h3>Invalid Invitation</h3>
        <p>{{ codeError }}</p>
        <p>If you believe this is a mistake, please contact your administrator.</p>
        <button @click="goToLogin" class="secondary-btn">Go to Login</button>
      </div>

      <!-- Valid Code - Show Registration Form -->
      <div v-else>
        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <!-- Name Fields -->
          <div class="name-group">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                v-model="formData.first_name"
                placeholder="First name"
                required
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                v-model="formData.last_name"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div class="form-group">
            <label for="phoneNumber">Phone Number *</label>
            <input
              type="tel"
              id="phoneNumber"
              v-model="formData.phone"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <!-- Date of Birth -->
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth *</label>
            <input
              type="date"
              id="dateOfBirth"
              v-model="formData.date_of_birth"
              required
              class="date-field"
            />
          </div>

          <!-- Password Fields -->
          <div class="form-group">
            <label for="password">Password *</label>
            <input
              type="password"
              id="password"
              v-model="formData.password"
              placeholder="Create a password"
              required
            />
            <small class="help-text"
              >At least 8 characters with uppercase, lowercase, number and special character</small
            >
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              placeholder="Confirm your password"

              required
            />
          </div>

          <button type="submit" class="register-btn" :disabled="isLoading">
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="register-footer">
          <p>Already have an account? <a @click="goToLogin" class="link">Sign in</a></p>
        </div>
      </div>
    </div>
  </div>
</template>
