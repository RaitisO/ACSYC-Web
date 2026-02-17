import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for users
interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  role: 'student' | 'parent' | 'teacher' | 'admin'
  application_status?: string
  created_at: string
}

interface UpdateUserProfileRequest {
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
}

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: 'student' | 'parent'
}

interface FamilyResponse {
  members: FamilyMember[]
}

interface TeacherProfile extends UserProfile {
  specializations?: string[]
  bio?: string
  hourly_rate?: number
}

class UserService {
  /**
   * Get user profile information
   * @param userId The user ID to fetch profile for
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await apiService.get(`/users/${userId}`)
      logger.info('User profile loaded', { userId }, 'userService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'userService')
      logger.error('Failed to load user profile', { userId, error: appError }, 'userService')
      throw appError
    }
  }

  /**
   * Update user profile information
   * @param userId The user ID to update
   * @param data Profile fields to update
   * @returns Updated user profile
   */
  async updateUserProfile(userId: string, data: UpdateUserProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiService.put(`/users/${userId}`, data)
      logger.info('User profile updated', { userId }, 'userService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'userService')
      logger.error('Failed to update user profile', { userId, data, error: appError }, 'userService')
      throw appError
    }
  }

  /**
   * Get family members for a user
   * @param userId The user ID to fetch family for
   * @returns List of family members
   */
  async getUserFamily(userId: string): Promise<FamilyResponse> {
    try {
      const response = await apiService.get(`/users/${userId}/family`)
      logger.info('User family loaded', { userId }, 'userService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'userService')
      logger.error('Failed to load family members', { userId, error: appError }, 'userService')
      throw appError
    }
  }

  /**
   * Get teacher-specific profile information
   * @param teacherId The teacher ID to fetch profile for
   * @returns Teacher profile data
   */
  async getTeacherProfile(teacherId: string): Promise<TeacherProfile> {
    try {
      const response = await apiService.get(`/teachers/${teacherId}`)
      logger.info('Teacher profile loaded', { teacherId }, 'userService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'userService')
      logger.error('Failed to load teacher profile', { teacherId, error: appError }, 'userService')
      throw appError
    }
  }

  /**
   * Update teacher-specific profile information
   * @param teacherId The teacher ID to update
   * @param data Teacher profile fields to update
   * @returns Updated teacher profile
   */
  async updateTeacherProfile(
    teacherId: string,
    data: Partial<TeacherProfile>,
  ): Promise<TeacherProfile> {
    try {
      const response = await apiService.put(`/teachers/${teacherId}`, data)
      logger.info('Teacher profile updated', { teacherId }, 'userService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'userService')
      logger.error('Failed to update teacher profile', { teacherId, data, error: appError }, 'userService')
      throw appError
    }
  }
}

export default new UserService()
