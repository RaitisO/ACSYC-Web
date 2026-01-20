import { ref, computed } from 'vue'

interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

interface FieldValidation {
  value: any
  rules: ValidationRule[]
  error: string
  touched: boolean
}

/**
 * Composable for form validation with real-time error tracking
 */
export function useFormValidation() {
  const fields = ref<Record<string, FieldValidation>>({})
  const isFormValid = computed(() => {
    return Object.values(fields.value).every(field => !field.error)
  })

  /**
   * Register a form field with validation rules
   */
  const registerField = (fieldName: string, initialValue: any = '', rules: ValidationRule[] = []) => {
    fields.value[fieldName] = {
      value: initialValue,
      rules,
      error: '',
      touched: false,
    }
  }

  /**
   * Validate a single field
   */
  const validateField = (fieldName: string) => {
    const field = fields.value[fieldName]
    if (!field) return true

    field.touched = true
    for (const rule of field.rules) {
      if (!rule.validate(field.value)) {
        field.error = rule.message
        return false
      }
    }
    field.error = ''
    return true
  }

  /**
   * Validate all fields in the form
   */
  const validateForm = () => {
    let isValid = true
    for (const fieldName in fields.value) {
      if (!validateField(fieldName)) {
        isValid = false
      }
    }
    return isValid
  }

  /**
   * Get field value
   */
  const getFieldValue = (fieldName: string) => {
    return fields.value[fieldName]?.value ?? ''
  }

  /**
   * Set field value and validate
   */
  const setFieldValue = (fieldName: string, value: any) => {
    if (fields.value[fieldName]) {
      fields.value[fieldName].value = value
    }
  }

  /**
   * Get field error message
   */
  const getFieldError = (fieldName: string) => {
    return fields.value[fieldName]?.error ?? ''
  }

  /**
   * Reset form
   */
  const resetForm = () => {
    for (const fieldName in fields.value) {
      const field = fields.value[fieldName]
      if (field) {
        field.error = ''
        field.touched = false
        field.value = ''
      }
    }
  }

  /**
   * Get all form data
   */
  const getFormData = () => {
    const data: Record<string, any> = {}
    for (const fieldName in fields.value) {
      const field = fields.value[fieldName]
      if (field) {
        data[fieldName] = field.value
      }
    }
    return data
  }

  return {
    registerField,
    validateField,
    validateForm,
    getFieldValue,
    setFieldValue,
    getFieldError,
    resetForm,
    getFormData,
    isFormValid,
  }
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (fieldName = 'This field') => ({
    validate: (value: any) => value && String(value).trim() !== '',
    message: `${fieldName} is required`,
  }),

  email: {
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message: 'Please enter a valid email address',
  },

  minLength: (length: number, fieldName = 'This field') => ({
    validate: (value: string) => value && value.length >= length,
    message: `${fieldName} must be at least ${length} characters long`,
  }),

  maxLength: (length: number, fieldName = 'This field') => ({
    validate: (value: string) => !value || value.length <= length,
    message: `${fieldName} must not exceed ${length} characters`,
  }),

  strongPassword: {
    validate: (value: string) => {
      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      return strongRegex.test(value)
    },
    message:
      'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  },

  match: (fieldValue: string, fieldName = 'Passwords') => ({
    validate: (value: string) => value === fieldValue,
    message: `${fieldName} do not match`,
  }),

  numeric: {
    validate: (value: string) => /^\d+$/.test(value),
    message: 'Please enter only numbers',
  },

  alphabetic: {
    validate: (value: string) => /^[a-zA-Z\s]+$/.test(value),
    message: 'Please enter only letters',
  },

  phone: {
    validate: (value: string) => {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
      return phoneRegex.test(value)
    },
    message: 'Please enter a valid phone number',
  },

  date: {
    validate: (value: string) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      return dateRegex.test(value) && !isNaN(Date.parse(value))
    },
    message: 'Please enter a valid date (YYYY-MM-DD)',
  },

  minAge: (age: number) => ({
    validate: (value: string) => {
      if (!value) return false
      const birthDate = new Date(value)
      const today = new Date()
      const calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return calculatedAge - 1 >= age
      }
      return calculatedAge >= age
    },
    message: `User must be at least ${age} years old`,
  }),
}
