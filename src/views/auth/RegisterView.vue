<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFormValidation, ValidationRules } from '@/composables/useFormValidation'
import { authService } from '@/services'
import '../../styles/views/auth.css'

const router = useRouter()

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  date_of_birth: string
  phone: string
  role: 'student' | 'parent'
}

const studentData = ref<FamilyMember>({
  id: 'student_0',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  date_of_birth: '',
  phone: '',
  role: 'student',
})

const parentMembers = ref<FamilyMember[]>([])
const includeParents = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

// Form validation
const { registerField, validateField, validateForm } = useFormValidation()

onMounted(() => {
  // Register student validation fields
  registerField('first_name', '', [
    ValidationRules.required('First name'),
    ValidationRules.alphabetic,
  ])
  registerField('last_name', '', [
    ValidationRules.required('Last name'),
    ValidationRules.alphabetic,
  ])
  registerField('email', '', [ValidationRules.required('Email'), ValidationRules.email])
  registerField('phone', '', [
    ValidationRules.required('Phone number'),
    ValidationRules.phone,
  ])
  registerField('date_of_birth', '', [
    ValidationRules.required('Date of birth'),
    ValidationRules.date,
    ValidationRules.minAge(13),
  ])
  registerField('password', '', [
    ValidationRules.required('Password'),
    ValidationRules.strongPassword,
  ])
  registerField('confirmPassword', '', [
    ValidationRules.required('Confirm password'),
  ])
})

const addParent = () => {
  const newParent: FamilyMember = {
    id: `parent_${Date.now()}`,
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    date_of_birth: '',
    phone: '',
    role: 'parent',
  }
  parentMembers.value.push(newParent)
}

const removeParent = (index: number) => {
  parentMembers.value.splice(index, 1)
  if (parentMembers.value.length === 0) {
    includeParents.value = false
  }
}

const validateMember = (member: FamilyMember): boolean => {
  // Check required fields
  if (!member.first_name || !member.last_name || !member.email || !member.phone || !member.date_of_birth) {
    return false
  }

  // Check if passwords match
  if (member.password !== member.confirmPassword) {
    return false
  }

  // Student-specific validation
  if (member.role === 'student') {
    // Check minimum age (13 years)
    const birthDate = new Date(member.date_of_birth)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    if (age < 13) {
      return false
    }
  }

  return true
}

const handleRegister = async () => {
  errorMessage.value = ''

  // Validate student
  if (!validateMember(studentData.value)) {
    errorMessage.value = 'Please fill all student fields correctly'
    return
  }

  // Validate all parents if included
  if (includeParents.value) {
    for (const parent of parentMembers.value) {
      if (!validateMember(parent)) {
        errorMessage.value = 'Please fill all parent fields correctly'
        return
      }
    }
  }

  isLoading.value = true

  try {
    // Build family member array
    const familyMembers = [
      {
        first_name: String(studentData.value.first_name).trim(),
        last_name: String(studentData.value.last_name).trim(),
        email: String(studentData.value.email).trim().toLowerCase(),
        password: studentData.value.password,
        date_of_birth: studentData.value.date_of_birth,
        phone: String(studentData.value.phone).trim(),
        role: studentData.value.role,
      },
    ]

    // Add parents if included
    if (includeParents.value) {
      for (const parent of parentMembers.value) {
        familyMembers.push({
          first_name: String(parent.first_name).trim(),
          last_name: String(parent.last_name).trim(),
          email: String(parent.email).trim().toLowerCase(),
          password: parent.password,
          date_of_birth: parent.date_of_birth,
          phone: String(parent.phone).trim(),
          role: parent.role,
        })
      }
    }

    // Send to backend
    await authService.registerFamily(familyMembers)

    console.log('Registration successful')
    // Redirect to confirmation page
    router.push('/registration-pending')
  } catch (error: any) {
    console.error('Registration error:', error)
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
}</script>

<template>
  <div class="register-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="register-card">
      <h1>Join ACSYC</h1>
      <p class="subtitle">Student & Family Registration</p>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <!-- STUDENT SECTION -->
        <div class="section-header">
          <h2>Student Information</h2>
        </div>

        <!-- Student Name Fields -->
        <div class="name-group">
          <div class="form-group">
            <label for="studentFirstName">First Name *</label>
            <input
              type="text"
              id="studentFirstName"
              v-model="studentData.first_name"
              placeholder="First name"
              @blur="validateField('first_name')"
              required
            />
          </div>
          <div class="form-group">
            <label for="studentLastName">Last Name *</label>
            <input
              type="text"
              id="studentLastName"
              v-model="studentData.last_name"
              placeholder="Last name"
              @blur="validateField('last_name')"
              required
            />
          </div>
        </div>

        <!-- Student Contact Information -->
        <div class="form-group">
          <label for="studentEmail">Email Address *</label>
          <input
            type="email"
            id="studentEmail"
            v-model="studentData.email"
            placeholder="Enter your email"
            @blur="validateField('email')"
            required
          />
        </div>

        <div class="form-group">
          <label for="studentPhone">Phone Number *</label>
          <input
            type="tel"
            id="studentPhone"
            v-model="studentData.phone"
            placeholder="Enter your phone number"
            @blur="validateField('phone')"
            required
          />
        </div>

        <!-- Student Date of Birth -->
        <div class="form-group">
          <label for="studentDOB">Date of Birth *</label>
          <input
            type="date"
            id="studentDOB"
            v-model="studentData.date_of_birth"
            @blur="validateField('date_of_birth')"
            required
            class="date-field"
          />
        </div>

        <!-- Student Password Fields -->
        <div class="form-group">
          <label for="studentPassword">Password *</label>
          <input
            type="password"
            id="studentPassword"
            v-model="studentData.password"
            placeholder="Create a password"
            @blur="validateField('password')"
            required
          />
          <small class="help-text"
            >At least 8 characters with uppercase, lowercase, number and special character</small
          >
        </div>

        <div class="form-group">
          <label for="studentConfirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="studentConfirmPassword"
            v-model="studentData.confirmPassword"
            placeholder="Confirm your password"
            @blur="validateField('confirmPassword')"
            required
          />
        </div>

        <!-- PARENT SECTION (Optional) -->
        <div class="parent-section">
          <div class="section-toggle">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeParents" />
              <span>Register parent(s) at the same time</span>
            </label>
            <p class="toggle-hint">Optional: You can add parents now or do it later</p>
          </div>

          <!-- Parent Forms -->
          <div v-if="includeParents" class="parents-list">
            <div v-for="(parent, index) in parentMembers" :key="parent.id" class="parent-form">
              <div class="parent-header">
                <h3>Parent {{ index + 1 }}</h3>
                <button
                  v-if="parentMembers.length > 1"
                  type="button"
                  @click="removeParent(index)"
                  class="remove-btn"
                >
                  ✕ Remove
                </button>
              </div>

              <div class="name-group">
                <div class="form-group">
                  <label :for="`parentFirstName_${index}`">First Name *</label>
                  <input
                    type="text"
                    :id="`parentFirstName_${index}`"
                    v-model="parent.first_name"
                    placeholder="First name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label :for="`parentLastName_${index}`">Last Name *</label>
                  <input
                    type="text"
                    :id="`parentLastName_${index}`"
                    v-model="parent.last_name"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label :for="`parentEmail_${index}`">Email Address *</label>
                <input
                  type="email"
                  :id="`parentEmail_${index}`"
                  v-model="parent.email"
                  placeholder="Enter email"
                  required
                />
              </div>

              <div class="form-group">
                <label :for="`parentPhone_${index}`">Phone Number *</label>
                <input
                  type="tel"
                  :id="`parentPhone_${index}`"
                  v-model="parent.phone"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div class="form-group">
                <label :for="`parentDOB_${index}`">Date of Birth *</label>
                <input
                  type="date"
                  :id="`parentDOB_${index}`"
                  v-model="parent.date_of_birth"
                  required
                  class="date-field"
                />
              </div>

              <div class="form-group">
                <label :for="`parentPassword_${index}`">Password *</label>
                <input
                  type="password"
                  :id="`parentPassword_${index}`"
                  v-model="parent.password"
                  placeholder="Create a password"
                  required
                />
                <small class="help-text"
                  >At least 8 characters with uppercase, lowercase, number and special character</small
                >
              </div>

              <div class="form-group">
                <label :for="`parentConfirmPassword_${index}`">Confirm Password *</label>
                <input
                  type="password"
                  :id="`parentConfirmPassword_${index}`"
                  v-model="parent.confirmPassword"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button type="button" @click="addParent" class="add-parent-btn">
              + Add Another Parent
            </button>
          </div>
        </div>

        <button type="submit" class="register-btn" :disabled="isLoading">
          {{ isLoading ? 'Creating Account...' : 'Complete Registration' }}
        </button>
      </form>

      <div class="register-footer">
        <p>Already have an account? <a @click="goToLogin" class="link">Sign in</a></p>
      </div>
    </div>
  </div>
</template>
