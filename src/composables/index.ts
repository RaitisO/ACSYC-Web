/**
 * Composables Barrel Export
 *
 * Provides clean imports for all composables:
 * import { useAuth, useFetch, useConnections } from '@/composables'
 *
 * Phase 5 Organization:
 * - Authentication & User: useAuth, useUserProfile
 * - Data Fetching: useFetch, useLessons, useConnections
 * - UI State: useModal, usePagination
 */

// Authentication & User Management
export { useAuth } from './useAuth'
export { useUserProfile } from './useUserProfile'

// Generic Data Fetching
export { useFetch } from './useFetch'

// Domain-Specific Data
export { useConnections } from './useConnections'
export { useLessons } from './useLessons'

// UI State Management
export { useModal, useModals } from './useModal'
export { usePagination } from './usePagination'

// Error Handling
export { useErrorHandler } from './useErrorHandler'

// Re-export form validation (already existed)
export { useFormValidation, ValidationRules } from './useFormValidation'
