import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RegistrationState,
  FamilyType,
  ParentInfo,
  StudentInfo,
  LearningPreferences,
  TeacherPreferences,
  SubjectsAvailability,
} from '@/types/registration'
import { Gender, RelationshipStyle } from '@/types/registration'

const STORAGE_KEY = 'registration_form_data'

/**
 * Registration Form Store
 *
 * Manages multi-step registration form state with local storage persistence.
 *
 * Features:
 * - Multi-step form state management
 * - Auto-save to localStorage
 * - Form reset capability
 * - Progress tracking
 * - Error message management
 *
 * Usage:
 * const store = useRegistrationStore()
 * store.setFamilyType('new')
 * store.setParentInfo({ first_name: 'John', ... })
 */
export const useRegistrationStore = defineStore('registration', () => {
  // State
  const currentStep = ref(1)
  const familyType = ref<FamilyType | null>(null)
  const parentInfo = ref<ParentInfo>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const studentInfo = ref<StudentInfo>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    interests: '',
  })
  const learningPreferences = ref<LearningPreferences>({
    learning_style: '',
    motivation: '',
    challenges: '',
  })
  const teacherPreferences = ref<TeacherPreferences>({
    gender: Gender.PREFER_NOT_TO_SAY,
    relationship_style: RelationshipStyle.AUTHORITATIVE,
    qualities: '',
    comments: '',
  })
  const subjectsAvailability = ref<SubjectsAvailability>({
    subjects: [],
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    custom_times: '',
    lessons_per_week: '',
  })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const verificationToken = ref<string | null>(null)
  const isTokenValid = ref(false)
  const approvedApplicationId = ref<string | null>(null)

  // Computed
  const formData = computed(() => ({
    family_type: familyType.value,
    parent_info: parentInfo.value,
    student_info: studentInfo.value,
    learning_preferences: learningPreferences.value,
    teacher_preferences: teacherPreferences.value,
    subjects_availability: subjectsAvailability.value,
  }))

  const isCurrentStepValid = computed(() => {
    switch (currentStep.value) {
      case 1:
        // Family type selection - valid when selected
        return familyType.value !== null
      case 2:
        // Parent info - all fields required for new family, only email for existing
        if (familyType.value === 'new') {
          return (
            parentInfo.value.first_name.trim() !== '' &&
            parentInfo.value.last_name.trim() !== '' &&
            parentInfo.value.email.trim() !== '' &&
            parentInfo.value.phone.trim() !== ''
          )
        } else {
          // Existing family - only email validation
          return parentInfo.value.email.trim() !== ''
        }
      case 3:
        // Student info - all fields required
        return (
          studentInfo.value.first_name.trim() !== '' &&
          studentInfo.value.last_name.trim() !== '' &&
          studentInfo.value.date_of_birth.trim() !== '' &&
          studentInfo.value.interests.trim() !== ''
        )
      case 4:
        // Learning preferences - all fields required
        return (
          learningPreferences.value.learning_style.trim() !== '' &&
          learningPreferences.value.motivation.trim() !== '' &&
          learningPreferences.value.challenges.trim() !== ''
        )
      case 5:
        // Teacher preferences - gender and relationship style required
        return (
          teacherPreferences.value.gender !== null &&
          teacherPreferences.value.relationship_style !== null &&
          teacherPreferences.value.qualities.trim() !== ''
        )
      case 6:
        // Subjects availability - at least one subject needed
        return subjectsAvailability.value.subjects.length > 0
      default:
        return false
    }
  })

  // Mutations
  const setCurrentStep = (step: number) => {
    currentStep.value = step
  }

  const goToNextStep = () => {
    if (currentStep.value < 6) {
      currentStep.value += 1
      saveToLocalStorage()
    }
  }

  const goToPreviousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value -= 1
    }
  }

  const setFamilyType = (type: FamilyType) => {
    familyType.value = type
    saveToLocalStorage()
  }

  const setParentInfo = (info: Partial<ParentInfo>) => {
    parentInfo.value = { ...parentInfo.value, ...info }
    saveToLocalStorage()
  }

  const setStudentInfo = (info: Partial<StudentInfo>) => {
    studentInfo.value = { ...studentInfo.value, ...info }
    saveToLocalStorage()
  }

  const setLearningPreferences = (prefs: Partial<LearningPreferences>) => {
    learningPreferences.value = { ...learningPreferences.value, ...prefs }
    saveToLocalStorage()
  }

  const setTeacherPreferences = (prefs: Partial<TeacherPreferences>) => {
    teacherPreferences.value = { ...teacherPreferences.value, ...prefs }
    saveToLocalStorage()
  }

  const setSubjectsAvailability = (subs: Partial<SubjectsAvailability>) => {
    subjectsAvailability.value = { ...subjectsAvailability.value, ...subs }
    saveToLocalStorage()
  }

  const setIsLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setIsSubmitting = (submitting: boolean) => {
    isSubmitting.value = submitting
  }

  const setErrorMessage = (message: string) => {
    errorMessage.value = message
  }

  const setSuccessMessage = (message: string) => {
    successMessage.value = message
  }

  const clearMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const setVerificationToken = (token: string | null) => {
    verificationToken.value = token
  }

  const setIsTokenValid = (valid: boolean) => {
    isTokenValid.value = valid
  }

  const setApprovedApplicationId = (id: string | null) => {
    approvedApplicationId.value = id
  }

  const resetForm = () => {
    currentStep.value = 1
    familyType.value = null
    parentInfo.value = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    }
    studentInfo.value = {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      email: '',
      interests: '',
    }
    learningPreferences.value = {
      learning_style: '',
      motivation: '',
      challenges: '',
    }
    teacherPreferences.value = {
      gender: Gender.PREFER_NOT_TO_SAY,
      relationship_style: RelationshipStyle.AUTHORITATIVE,
      qualities: '',
      comments: '',
    }
    subjectsAvailability.value = {
      subjects: [],
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      custom_times: '',
      lessons_per_week: '',
    }
    errorMessage.value = ''
    successMessage.value = ''
    verificationToken.value = null
    isTokenValid.value = false
    approvedApplicationId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  // localStorage persistence
  const saveToLocalStorage = () => {
    try {
      const state: RegistrationState = {
        currentStep: currentStep.value,
        familyType: familyType.value,
        parentInfo: parentInfo.value,
        studentInfo: studentInfo.value,
        learningPreferences: learningPreferences.value,
        teacherPreferences: teacherPreferences.value,
        subjectsAvailability: subjectsAvailability.value,
        isLoading: false,
        isSubmitting: false,
        errorMessage: '',
        successMessage: '',
        verificationToken: verificationToken.value,
        isTokenValid: isTokenValid.value,
        approvedApplicationId: approvedApplicationId.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save registration form to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state: RegistrationState = JSON.parse(saved)
        currentStep.value = state.currentStep || 1
        familyType.value = state.familyType || null
        parentInfo.value = state.parentInfo || parentInfo.value
        studentInfo.value = state.studentInfo || studentInfo.value
        learningPreferences.value = state.learningPreferences || learningPreferences.value
        teacherPreferences.value = state.teacherPreferences || teacherPreferences.value
        
        // Ensure subjectsAvailability has proper structure
        if (state.subjectsAvailability) {
          subjectsAvailability.value = {
            subjects: Array.isArray(state.subjectsAvailability.subjects) ? state.subjectsAvailability.subjects : [],
            availability: state.subjectsAvailability.availability || {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
              saturday: [],
              sunday: [],
            },
            custom_times: state.subjectsAvailability.custom_times || '',
            lessons_per_week: state.subjectsAvailability.lessons_per_week || '',
          }
        }
        
        verificationToken.value = state.verificationToken || null
        isTokenValid.value = state.isTokenValid || false
        approvedApplicationId.value = state.approvedApplicationId || null
      }
    } catch (error) {
      console.error('Failed to load registration form from localStorage:', error)
    }
  }

  // Initialize store
  loadFromLocalStorage()

  return {
    // State
    currentStep,
    familyType,
    parentInfo,
    studentInfo,
    learningPreferences,
    teacherPreferences,
    subjectsAvailability,
    isLoading,
    isSubmitting,
    errorMessage,
    successMessage,
    verificationToken,
    isTokenValid,
    approvedApplicationId,

    // Computed
    formData,
    isCurrentStepValid,

    // Methods
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    setFamilyType,
    setParentInfo,
    setStudentInfo,
    setLearningPreferences,
    setTeacherPreferences,
    setSubjectsAvailability,
    setIsLoading,
    setIsSubmitting,
    setErrorMessage,
    setSuccessMessage,
    clearMessages,
    setVerificationToken,
    setIsTokenValid,
    setApprovedApplicationId,
    resetForm,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})
