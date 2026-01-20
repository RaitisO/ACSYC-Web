<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFormValidation, ValidationRules } from '@/composables/useFormValidation'
import apiService from '@/services/api'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// Form validation
const { registerField, validateField, validateForm, setFieldValue } = useFormValidation()

onMounted(() => {
  // Check if user is already logged in
  const user = localStorage.getItem('user')
  if (user) {
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
    const data = await apiService.post('/login', {
      email: email.value,
      password: password.value,
    })

    console.log('Login successful:', data)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please try again.'
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
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
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

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #38aad9 0%, #42993c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.back-home-btn {
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-home-btn:hover {
  background: white;
  color: #38aad9;
  transform: translateX(-5px);
}

.login-card {
  background: #fff9d8;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

/* Keep the rest of your existing login styles */
h1 {
  color: #6c0f5f;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.subtitle {
  color: #42993c;
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  color: #6c0f5f;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #f2d422;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #38aad9;
}

.login-btn {
  width: 100%;
  background: #bf1ba9;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.login-btn:hover:not(:disabled) {
  background: #9bbf19;
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #fcc;
}

.login-footer {
  text-align: center;
}

.link {
  color: #38aad9;
  text-decoration: none;
  font-weight: bold;
}

.link:hover {
  text-decoration: underline;
}
</style>
