import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for authentication
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    role: string
  }
  token?: string
}

interface FamilyMember {
  first_name: string
  last_name: string
  email: string
  password: string
  date_of_birth: string
  phone: string
  role: 'student' | 'parent'
}

interface RegisterFamilyRequest {
  members: FamilyMember[]
}

interface TeacherRegistrationRequest {
  code: string
  first_name: string
  last_name: string
  email: string
  password: string
  date_of_birth: string
  phone: string
}

class AuthService {
  /**
   * Login user with email and password
   * @param email User email
   * @param password User password
   * @returns User data and authentication token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('[authService] 🔐 Attempting login for:', email)
      const payload = {
        email,
        password,
      }
      console.log('[authService] 📤 Sending payload:', payload)
      
      const response = await apiService.post('/login', payload)
      
      console.log('[authService] ✅ Login response received:', response)
      console.log('[authService] ✅ Response type:', typeof response)
      console.log('[authService] ✅ Response keys:', Object.keys(response || {}))
      console.log('[authService] ✅ Response.user:', response?.user)
      console.log('[authService] ✅ Response.message:', response?.message)
      
      if (!response || typeof response !== 'object') {
        console.error('[authService] ❌ Response is not an object:', response)
        throw new Error('Invalid response format')
      }
      
      logger.info('Login successful', { email }, 'authService')
      return response as LoginResponse
    } catch (error: any) {
      console.log('[authService] ❌ Login error caught:', error)
      console.log('[authService] ❌ Error response:', error.response?.data)
      console.log('[authService] ❌ Error status:', error.response?.status)
      console.log('[authService] ❌ Error message:', error.message)
      
      const appError = errorService.handleError(error, 'authService')
      logger.error('Login failed', { email, error: appError }, 'authService')
      throw appError
    }
  }

  /**
   * Register a family (student and optional parents)
   * @param members Array of family members to register
   * @returns Confirmation response
   */
  async registerFamily(members: FamilyMember[]): Promise<any> {
    try {
      const response = await apiService.post('/register-family', {
        members,
      })
      logger.info('Family registration successful', { memberCount: members.length }, 'authService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'authService')
      logger.error('Family registration failed', { error: appError }, 'authService')
      throw appError
    }
  }

  /**
   * Register a teacher with invitation code validation
   * @param data Teacher registration data including invitation code
   * @returns Confirmation response
   */
  async registerTeacher(data: TeacherRegistrationRequest): Promise<any> {
    try {
      const response = await apiService.post('/register-teacher', data)
      logger.info('Teacher registration successful', { email: data.email }, 'authService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'authService')
      logger.error('Teacher registration failed', { email: data.email, error: appError }, 'authService')
      throw appError
    }
  }

  /**
   * Logout current user
   * @returns Logout confirmation
   */
  async logout(): Promise<any> {
    try {
      const response = await apiService.post('/logout', {})
      logger.info('Logout successful', undefined, 'authService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'authService')
      logger.error('Logout failed', { error: appError }, 'authService')
      throw appError
    }
  }

  /**
   * Change user password (called on first login)
   * @param newPassword New password for the user
   * @returns Password change confirmation
   */
  async changePassword(newPassword: string): Promise<any> {
    try {
      const response = await apiService.post('/user/change-password', {
        new_password: newPassword,
      })
      logger.info('Password changed successfully', undefined, 'authService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'authService')
      logger.error('Password change failed', { error: appError }, 'authService')
      throw appError
    }
  }
}

export default new AuthService()
