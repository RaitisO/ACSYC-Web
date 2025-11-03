<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  date_of_birth: '',
  phone: '',
  role: '', // 'student' or 'parent'
})

const Roles = [
  { value: '', label: 'Select your role', disabled: true },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
]

const goHome = () => {
  router.push('/')
}
const goToLogin = () => {
  router.push('/login')
}
const handleRegister = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData.value),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    console.log('Registration successful:', data)
    router.push('/login')
  } catch (error) {
    console.error('Registration error:', error)
    // Show error message to user
    alert(error.message)
  }
}
</script>

<template>
  <div class="register-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="register-card">
      <h1>Join ACSYC</h1>

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

        <!-- User Type -->
        <div class="form-group">
          <label for="userType">I am a *</label>
          <select id="userType" v-model="formData.role" required class="select-field">
            <option
              v-for="type in Roles"
              :key="type.value"
              :value="type.value"
              :disabled="type.disabled"
            >
              {{ type.label }}
            </option>
          </select>
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
          <small class="help-text">Must be at least 8 characters</small>
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

        <button type="submit" class="register-btn">Create Account</button>
      </form>

      <div class="register-footer">
        <p>Already have an account? <a @click="goToLogin" class="link">Sign in</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff9a1f 0%, #bf1ba9 100%);
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
  color: #ff9a1f;
  transform: translateX(-5px);
}

.register-card {
  background: #fff9d8;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
}

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

.name-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

input,
.select-field {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #f2d422;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  background: white;
}

input:focus,
.select-field:focus {
  outline: none;
  border-color: #38aad9;
}

.select-field {
  cursor: pointer;
}

.date-field {
  /* Date input specific styling */
}

.help-text {
  display: block;
  color: #42993c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.register-btn {
  width: 100%;
  background: #9bbf19;
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

.register-btn:hover {
  background: #42993c;
  transform: translateY(-2px);
}

.register-footer {
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

@media (max-width: 480px) {
  .name-group {
    grid-template-columns: 1fr;
  }

  .register-card {
    padding: 2rem;
  }

  .back-home-btn {
    left: 1rem;
    top: 1rem;
  }
}
</style>
