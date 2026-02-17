import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for preferences
interface TeacherColor {
  teacher_id: string
  color: string
  assigned_at: string
}

interface UserPreferences {
  user_id: string
  theme?: 'light' | 'dark'
  language?: string
  timezone?: string
  notifications_enabled: boolean
  email_notifications: boolean
  updated_at: string
}

interface NotificationSettings {
  user_id: string
  lesson_notifications: boolean
  connection_notifications: boolean
  message_notifications: boolean
  email_notifications: boolean
  sms_notifications?: boolean
  updated_at: string
}

interface ColorResponse {
  teachers: TeacherColor[]
}

class PreferenceService {
  /**
   * Get all teacher color assignments
   * @returns List of teacher colors for UI differentiation
   */
  async getTeacherColors(): Promise<ColorResponse> {
    try {
      const response = await apiService.get('/teachers/colors')
      logger.info('Teacher colors loaded', undefined, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to load teacher colors', { error: appError }, 'preferenceService')
      throw appError
    }
  }

  /**
   * Update a teacher's assigned color
   * @param teacherId The teacher ID
   * @param color The color value (hex or named color)
   * @returns Updated color assignment
   */
  async updateTeacherColor(teacherId: string, color: string): Promise<TeacherColor> {
    try {
      const response = await apiService.put(`/teachers/${teacherId}/color`, {
        color,
      })
      logger.info('Teacher color updated', { teacherId, color }, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to update teacher color', { teacherId, error: appError }, 'preferenceService')
      throw appError
    }
  }

  /**
   * Get user preferences and settings
   * @param userId The user ID
   * @returns User preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await apiService.get(`/users/${userId}/preferences`)
      logger.info('User preferences loaded', { userId }, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to load user preferences', { userId, error: appError }, 'preferenceService')
      throw appError
    }
  }

  /**
   * Update user preferences
   * @param userId The user ID
   * @param prefs Preferences to update
   * @returns Updated preferences
   */
  async updateUserPreferences(
    userId: string,
    prefs: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    try {
      const response = await apiService.put(`/users/${userId}/preferences`, prefs)
      logger.info('User preferences updated', { userId }, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to update user preferences', { userId, prefs, error: appError }, 'preferenceService')
      throw appError
    }
  }

  /**
   * Get notification settings for a user
   * @param userId The user ID
   * @returns Notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const response = await apiService.get(`/users/${userId}/notifications/settings`)
      logger.info('Notification settings loaded', { userId }, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to load notification settings', { userId, error: appError }, 'preferenceService')
      throw appError
    }
  }

  /**
   * Update notification settings for a user
   * @param userId The user ID
   * @param settings Settings to update
   * @returns Updated notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    try {
      const response = await apiService.put(`/users/${userId}/notifications/settings`, settings)
      logger.info('Notification settings updated', { userId }, 'preferenceService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'preferenceService')
      logger.error('Failed to update notification settings', { userId, settings, error: appError }, 'preferenceService')
      throw appError
    }
  }
}

export default new PreferenceService()
