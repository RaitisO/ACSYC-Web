/**
 * Registration Domain Types
 *
 * Defines all TypeScript interfaces and enums for the registration system.
 * Matches backend Go structs for seamless API integration.
 */

// Enums for form options
export enum FamilyType {
  NEW = 'new',
  EXISTING = 'existing',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum RelationshipStyle {
  AUTHORITATIVE = 'authoritative',
  AUTHORITARIAN = 'authoritarian',
  PERMISSIVE = 'permissive',
  UNINVOLVED = 'uninvolved',
}

export enum Role {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
}

// Form Data Interfaces
export interface ParentInfo {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export interface StudentInfo {
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  interests: string
}

export interface LearningPreferences {
  learning_style: string
  motivation: string
  challenges: string
}

export interface TeacherPreferences {
  gender: Gender
  relationship_style: RelationshipStyle
  qualities: string
  comments: string
}

export interface SubjectsAvailability {
  subjects: string[]
  availability: Record<string, string[]> // day -> times array
  custom_times: string
  lessons_per_week: number | string
}

// Complete Registration Application
export interface RegistrationApplication {
  family_type: FamilyType
  parent_info: ParentInfo
  student_info: StudentInfo
  learning_preferences: LearningPreferences
  teacher_preferences: TeacherPreferences
  subjects_availability: SubjectsAvailability
}

// API Response Types
export interface ApplicationSubmitResponse {
  success: boolean
  application_id: string
  message: string
  verification_email_sent: boolean
}

export interface VerificationResponse {
  success: boolean
  token_valid: boolean
  application_id: string
  message: string
}

export interface PasswordSetupResponse {
  success: boolean
  user_id: string
  message: string
}

// Registration Store State
export interface RegistrationState {
  // Form data
  currentStep: number
  familyType: FamilyType | null
  parentInfo: ParentInfo
  studentInfo: StudentInfo
  learningPreferences: LearningPreferences
  teacherPreferences: TeacherPreferences
  subjectsAvailability: SubjectsAvailability
  
  // UI state
  isLoading: boolean
  isSubmitting: boolean
  errorMessage: string
  successMessage: string
  
  // Verification state
  verificationToken: string | null
  isTokenValid: boolean
  approvedApplicationId: string | null
}

// Form validation error map
export interface FormErrors {
  [key: string]: string
}
