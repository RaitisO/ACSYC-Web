/**
 * Services Barrel Export
 *
 * Provides convenient single-import access to all domain-specific services.
 * This centralizes service management and makes imports cleaner throughout the app.
 *
 * Usage:
 *   import { authService, applicationService, userService } from '@/services'
 *
 *   Instead of:
 *   import authService from '@/services/authService'
 *   import applicationService from '@/services/applicationService'
 *   import userService from '@/services/userService'
 */

// Phase 3 Services
export { default as authService } from './authService'
export { default as invitationService } from './invitationService'
export { default as applicationService } from './applicationService'

// Phase 4 Services
export { default as userService } from './userService'
export { default as lessonService } from './lessonService'
export { default as connectionService } from './connectionService'
export { default as preferenceService } from './preferenceService'
export { default as noteService } from './noteService'

// Base HTTP service (rarely used directly after service layer)
export { default as apiService } from './api'

// Phase 9 Error Handling
export { errorService, type AppError, type ErrorType } from './errorService'

// Re-export types if needed in the future
export type { } from './authService'
export type { } from './invitationService'
export type { } from './applicationService'
export type { } from './userService'
export type { } from './lessonService'
export type { } from './connectionService'
export type { } from './preferenceService'
export type { } from './noteService'
