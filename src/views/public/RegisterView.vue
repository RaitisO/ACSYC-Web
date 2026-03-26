<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationStore } from '@/stores/registrationStore'
import { useRegistration } from '@/composables/useRegistration'
import { FamilyType } from '@/types/registration'
import FormInput from '@/components/Registration/FormInput.vue'
import FormSelect from '@/components/Registration/FormSelect.vue'
import ProgressBar from '@/components/Registration/ProgressBar.vue'
import ConfirmationModal from '@/components/Registration/ConfirmationModal.vue'
import '../../styles/registration.css'

const router = useRouter()
const store = useRegistrationStore()
const { submitApplication, isSubmitting, error: submissionError } = useRegistration()

const showAbortModal = ref(false)

// Step options
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const relationshipStyleOptions = [
  { value: 'authoritative', label: 'Authoritative (clear rules with warmth)' },
  { value: 'authoritarian', label: 'Authoritarian (strict rules)' },
  { value: 'permissive', label: 'Permissive (flexible, few rules)' },
  { value: 'uninvolved', label: 'Uninvolved (minimal engagement)' },
]

const learningStyleOptions = [
  { value: 'visual', label: 'Visual (diagrams, charts, images)' },
  { value: 'auditory', label: 'Auditory (listening, discussion)' },
  { value: 'kinesthetic', label: 'Kinesthetic (hands-on, movement)' },
  { value: 'reading_writing', label: 'Reading/Writing (text-based)' },
]

// Registration steps configuration
const steps = [
  { number: 1, title: 'Family Type', description: 'New or existing family' },
  { number: 2, title: 'Parent Info', description: 'Your details' },
  { number: 3, title: 'Student Info', description: 'Student details' },
  { number: 4, title: 'Learning Prefs', description: 'Preferences' },
  { number: 5, title: 'Teacher Prefs', description: 'Teacher preferences' },
  { number: 6, title: 'Subjects & Hours', description: 'Hours and subjects' },
]

// Availability times
const availabilityTimes = [
  '8:00', '9:00', '10:15', '11:15', '12:30', '13:30', '14:45', '15:45', '17:00', '18:00', '19:15', '20:15', '21:30', '22:30', '23:45',
]

// Days of week
const daysOfWeek = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

// Lessons per week options
const lessonsPerWeekOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: 'more', label: 'More' },
]

// Initialize on mount
onMounted(() => {
  // Load stored data from localStorage
  store.loadFromLocalStorage()
})

// Watch for submission errors from backend
watch(submissionError, (newError) => {
  if (newError) {
    store.setErrorMessage(newError)
  }
})

// Reset parent info when family type changes
watch(() => store.familyType, (newType) => {
  if (newType !== null) {
    // Clear previous parent info when switching types
    store.setParentInfo({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    })
  }
})

// Subjects list (expandable in the future)
const subjectsList = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'language', label: 'Foreign Language' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
]

// Computed
const canGoNext = computed(() => {
  return store.isCurrentStepValid
})

const canGoBack = computed(() => {
  return store.currentStep > 1
})

// Methods
const validateCurrentStep = (): boolean => {
  switch (store.currentStep) {
    case 1:
      return !!store.familyType
    case 2:
      // Different validation for new vs existing family
      if (store.familyType === FamilyType.NEW) {
        return (
          store.parentInfo.first_name.trim() !== '' &&
          store.parentInfo.last_name.trim() !== '' &&
          store.parentInfo.email.trim() !== '' &&
          store.parentInfo.phone.trim() !== ''
        )
      } else {
        // Existing family - only email required
        return store.parentInfo.email.trim() !== ''
      }
    case 3:
      return (
        store.studentInfo.first_name.trim() !== '' &&
        store.studentInfo.last_name.trim() !== '' &&
        store.studentInfo.date_of_birth.trim() !== '' &&
        store.studentInfo.email.trim() !== '' &&
        store.studentInfo.interests.trim() !== ''
      )
    case 4:
      return (
        store.learningPreferences.learning_style.trim() !== '' &&
        store.learningPreferences.motivation.trim() !== '' &&
        store.learningPreferences.challenges.trim() !== ''
      )
    case 5:
      return (
        store.teacherPreferences.qualities.trim() !== ''
      )
    case 6:
      return (
        Array.isArray(store.subjectsAvailability.subjects) &&
        store.subjectsAvailability.subjects.length > 0 &&
        Object.values(store.subjectsAvailability.availability).some(times => (times as string[]).length > 0) &&
        store.subjectsAvailability.lessons_per_week !== ''
      )
    default:
      return false
  }
}

const handleNext = () => {
  store.clearMessages()

  if (!validateCurrentStep()) {
    store.setErrorMessage('Please fill in all required fields')
    return
  }

  store.goToNextStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePrevious = () => {
  store.goToPreviousStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSubmit = async () => {
  store.clearMessages()

  // Final validation
  if (!validateCurrentStep()) {
    store.setErrorMessage('Please fill in all required fields')
    return
  }

  try {
    store.setIsSubmitting(true)
    
    // Ensure family type is selected (should not happen if validation works)
    if (!store.familyType) {
      throw new Error('Family type must be selected')
    }
    
    const response = await submitApplication({
      family_type: store.familyType,
      parent_info: store.parentInfo,
      student_info: store.studentInfo,
      learning_preferences: store.learningPreferences,
      teacher_preferences: store.teacherPreferences,
      subjects_availability: store.subjectsAvailability,
    })
    
    store.setSuccessMessage(response.message)
    
    // Redirect to verification (user will receive email)
    setTimeout(() => {
      router.push('/register/success')
    }, 1500)
  } catch (err: unknown) {
    const error = err as { message?: string }
    store.setErrorMessage(error.message || 'Failed to submit registration')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    store.setIsSubmitting(false)
  }
}

const handleAbort = () => {
  showAbortModal.value = true
}

const confirmAbort = () => {
  store.resetForm()
  router.push('/')
}

const goHome = () => {
  router.push('/')
}

// Helper functions for availability grid
const toggleTime = (day: string, time: string) => {
  const dayTimes = store.subjectsAvailability.availability[day] || []
  const index = dayTimes.indexOf(time)
  if (index > -1) {
    dayTimes.splice(index, 1)
  } else {
    dayTimes.push(time)
  }
  store.setSubjectsAvailability({
    availability: { ...store.subjectsAvailability.availability, [day]: dayTimes },
  })
}

const isTimeSelected = (day: string, time: string): boolean => {
  return (store.subjectsAvailability.availability[day] || []).includes(time)
}

const toggleSubject = (subject: string) => {
  // Ensure subjects is an array
  if (!Array.isArray(store.subjectsAvailability.subjects)) {
    store.subjectsAvailability.subjects = []
  }
  
  const index = store.subjectsAvailability.subjects.indexOf(subject)
  if (index > -1) {
    store.subjectsAvailability.subjects.splice(index, 1)
  } else {
    store.subjectsAvailability.subjects.push(subject)
  }
  store.setSubjectsAvailability({ subjects: store.subjectsAvailability.subjects })
}

const isSubjectSelected = (subject: string): boolean => {
  // Ensure subjects is an array before checking
  if (!Array.isArray(store.subjectsAvailability.subjects)) {
    return false
  }
  return store.subjectsAvailability.subjects.includes(subject)
}

// Computed property for validating subjects array
const selectedSubjects = computed(() => {
  if (!Array.isArray(store.subjectsAvailability.subjects)) {
    return []
  }
  return store.subjectsAvailability.subjects
})
</script>

<template>
  <div class="registration-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <!-- Header -->
    <div class="registration-header">
      <h1>Create Your Account</h1>
      <p v-if="store.familyType" class="family-type-label">
        {{ store.familyType === FamilyType.NEW ? 'New Family Registration' : 'Existing Family Registration' }}
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="store.errorMessage" class="alert alert--error">
      <span class="alert-icon">✕</span>
      <span class="alert-message">{{ store.errorMessage }}</span>
    </div>

    <!-- Success Message -->
    <div v-if="store.successMessage" class="alert alert--success">
      <span class="alert-icon">✓</span>
      <span class="alert-message">{{ store.successMessage }}</span>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <!-- Progress Bar -->
      <ProgressBar :current-step="store.currentStep" :total-steps="6" :steps="steps" />
      <!-- Step 1: Family Type Selection -->
      <div v-if="store.currentStep === 1" class="form-step">
        <h2>Is this a new family or existing family registration?</h2>
        <p class="step-description">
          Choose whether this is your first time registering with ACSYC or if you have an existing account.
        </p>

        <div class="family-type-options">
          <button
            @click="store.setFamilyType(FamilyType.NEW)"
            :class="['family-type-btn', { 'family-type-btn--active': store.familyType === FamilyType.NEW }]"
          >
            <span class="btn-title">New Family</span>
            <span class="btn-description">First time registering</span>
          </button>

          <button
            @click="store.setFamilyType(FamilyType.EXISTING)"
            :class="['family-type-btn', { 'family-type-btn--active': store.familyType === FamilyType.EXISTING }]"
          >
            <span class="btn-title">Existing Family</span>
            <span class="btn-description">Registering another student</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Parent Information -->
      <div v-if="store.currentStep === 2" class="form-step">
        <h2 v-if="store.familyType === FamilyType.NEW">Parent/Guardian Information</h2>
        <h2 v-else>Verify Your Email</h2>
        <p v-if="store.familyType === FamilyType.NEW" class="step-description">Please provide your contact information.</p>
        <p v-else class="step-description">Please provide the email associated with your existing account.</p>

        <!-- New Family: Full Parent Info -->
        <template v-if="store.familyType === FamilyType.NEW">
          <FormInput
            v-model="store.parentInfo.first_name"
            label="First Name"
            placeholder="John"
            required
          />

          <FormInput
            v-model="store.parentInfo.last_name"
            label="Last Name"
            placeholder="Smith"
            required
          />

          <FormInput
            v-model="store.parentInfo.email"
            type="email"
            label="Email Address"
            placeholder="john@example.com"
            required
          />

          <FormInput
            v-model="store.parentInfo.phone"
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            required
          />
        </template>

        <!-- Existing Family: Only Email -->
        <template v-else>
          <FormInput
            v-model="store.parentInfo.email"
            type="email"
            label="Email Address"
            placeholder="john@example.com"
            hint="The email associated with your family's account"
            required
            
          />
        </template>
      </div>

      <!-- Step 3: Student Information -->
      <div v-if="store.currentStep === 3" class="form-step">
        <h2>Student Information</h2>
        <p class="step-description">Tell us about the student.</p>

        <FormInput
          v-model="store.studentInfo.first_name"
          label="First Name"
          placeholder="Jane"
          required
        />

        <FormInput
          v-model="store.studentInfo.last_name"
          label="Last Name"
          placeholder="Smith"
          required

        />

        <FormInput
          v-model="store.studentInfo.date_of_birth"
          type="date"
          label="Date of Birth"
          required
        />

        <FormInput
          v-model="store.studentInfo.email"
          type="email"
          label="Student Email"
          placeholder="jane@example.com"
          required
          hint="Your student will use this email to log in"
        />

        <FormInput
          v-model="store.studentInfo.interests"
          label="Interests & Hobbies"
          placeholder="e.g., Mathematics, Science, Music, Sports, etc."
          required

        />
      </div>

      <!-- Step 4: Learning Preferences -->
      <div v-if="store.currentStep === 4" class="form-step">
        <h2>Learning Preferences</h2>
        <p class="step-description">Help us understand how your student learns best.</p>

        <FormSelect
          v-model="store.learningPreferences.learning_style"
          label="Preferred Learning Style"
          :options="learningStyleOptions"
          required
        />

        <FormInput
          v-model="store.learningPreferences.motivation"
          label="What motivates your student?"
          placeholder="e.g., Competition, mastery, helping others, etc."
          required
        />

        <FormInput
          v-model="store.learningPreferences.challenges"
          label="Current Learning Challenges"
          placeholder="e.g., Concentration, time management, specific subjects, etc."
          required
        />
      </div>

      <!-- Step 5: Teacher Preferences -->
      <div v-if="store.currentStep === 5" class="form-step">
        <h2>Teacher Preferences</h2>
        <p class="step-description">Help us match the right teacher for your student.</p>

        <FormSelect
          v-model="store.teacherPreferences.gender"
          label="Teacher Gender Preference"
          :options="genderOptions"
          required
        />

        <FormSelect
          v-model="store.teacherPreferences.relationship_style"
          label="Preferred Teaching Style"
          :options="relationshipStyleOptions"
          required
        />

        <FormInput
          v-model="store.teacherPreferences.qualities"
          label="Desired Teacher Qualities"
          placeholder="e.g., Patient, creative, strict, encouraging, etc."
          required
        />

        <FormInput
          v-model="store.teacherPreferences.comments"
          label="Additional Comments"
          placeholder="Any other information about teacher preferences..."
        />
      </div>

      <!-- Step 6: Subjects & Availability -->
      <div v-if="store.currentStep === 6" class="form-step">
        <h2>Subjects & Availability</h2>
        <p class="step-description">Select your subjects and available times for tutoring.</p>

        <!-- Subjects Section -->
        <div class="subjects-section">
          <label class="section-label">Subjects <span class="required-asterisk">*</span></label>
          <div class="subjects-grid">
            <button
              v-for="subject in subjectsList"
              :key="subject.value"
              type="button"
              :class="['subject-btn', { 'subject-btn--selected': isSubjectSelected(subject.value) }]"
              @click="toggleSubject(subject.value)"
            >
              {{ subject.label }}
            </button>
          </div>
          <p v-if="selectedSubjects.length === 0" class="form-error">
            Please select at least one subject
          </p>
        </div>

        <!-- Availability Grid -->
        <div class="availability-section">
          <label class="section-label">Availability <span class="required-asterisk">*</span></label>
          <p class="availability-hint">Select time slots for each day you're available (at least one time per day)</p>
          
          <div class="time-grid">
            <!-- Header row with times -->
            <div class="time-grid-header">
              <div class="time-grid-day-col"></div>
              <div v-for="time in availabilityTimes" :key="time" class="time-grid-header-cell">
                {{ time }}
              </div>
            </div>

            <!-- Day rows with checkboxes -->
            <div v-for="day in daysOfWeek" :key="day.value" class="time-grid-row">
              <div class="time-grid-day-label">{{ day.label }}</div>
              <div
                v-for="time in availabilityTimes"
                :key="`${day.value}-${time}`"
                @click="toggleTime(day.value, time)"
                :class="['time-grid-cell', { 'time-grid-cell--selected': isTimeSelected(day.value, time) }]"
              >
                <input
                  type="checkbox"
                  :checked="isTimeSelected(day.value, time)"
                  class="time-grid-checkbox"
                  @change.stop="toggleTime(day.value, time)"
                />
              </div>
            </div>
          </div>

          <p v-if="!Object.values(store.subjectsAvailability.availability).some(times => times.length > 0)" class="form-error">
            Please select at least one time slot
          </p>
        </div>

        <!-- Custom Times -->
        <FormInput
          v-model="store.subjectsAvailability.custom_times"
          label="Custom Times (Optional)"
          placeholder="e.g., 8:30, 16:30, 20:00"
          hint="Enter specific times not listed above (comma-separated)"
          @update:modelValue="store.setSubjectsAvailability({ custom_times: store.subjectsAvailability.custom_times })"
        />

        <!-- Lessons per Week -->
        <div class="lessons-section">
          <label class="section-label">How many lessons per week? <span class="required-asterisk">*</span></label>
          <div class="lessons-options">
            <button
              v-for="option in lessonsPerWeekOptions"
              :key="option.value"
              type="button"
              :class="['lesson-btn', { 'lesson-btn--selected': store.subjectsAvailability.lessons_per_week === option.value }]"
              @click="store.setSubjectsAvailability({ lessons_per_week: option.value })"
            >
              {{ option.label }}
            </button>
          </div>

          <!-- Custom number input for "More" -->
          <div v-if="store.subjectsAvailability.lessons_per_week === 'more'" class="custom-lessons">
            <FormInput
              v-model.number="store.subjectsAvailability.lessons_per_week"
              type="number"
              label="Number of lessons per week"
              placeholder="e.g., 4, 5, 6"
              min="4"
              @update:modelValue="store.setSubjectsAvailability({ lessons_per_week: store.subjectsAvailability.lessons_per_week })"
            />
          </div>

          <p v-if="!store.subjectsAvailability.lessons_per_week" class="form-error">
            Please select number of lessons per week
          </p>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          v-if="canGoBack"
          @click="handlePrevious"
          class="btn btn--secondary"
          :disabled="isSubmitting"
        >
          ← Previous
        </button>

        <button
          v-if="store.currentStep < 6"
          @click="handleNext"
          class="btn btn--primary"
          :disabled="!canGoNext || isSubmitting"
        >
          Next →
        </button>

        <button
          v-if="store.currentStep === 6"
          @click="handleSubmit"
          class="btn btn--success"
          :disabled="!canGoNext || isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Complete Registration' }}
        </button>

        <button
          v-if="store.currentStep > 1"
          @click="handleAbort"
          class="btn btn--abort"
          :disabled="isSubmitting"
        >
          Cancel Registration
        </button>
      </div>
    </div>

    <!-- Abort Confirmation Modal -->
    <ConfirmationModal
      :is-open="showAbortModal"
      title="Cancel Registration"
      message="Are you sure you want to cancel? Your progress will be saved, but you can come back to finish later."
      confirm-text="Yes, Cancel"
      cancel-text="Keep Registering"
      is-dangerous
      @confirm="confirmAbort"
      @cancel="showAbortModal = false"
    />
  </div>
</template>
