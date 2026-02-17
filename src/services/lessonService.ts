import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for lessons
interface Lesson {
  id: string
  title: string
  description?: string
  teacher_id: string
  student_id: string
  status: 'scheduled' | 'completed' | 'cancelled'
  start_time: string
  end_time: string
  subject?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface CreateLessonRequest {
  title: string
  description?: string
  teacher_id: string
  student_id: string
  start_time: string
  end_time: string
  subject?: string
}

interface UpdateLessonRequest {
  title?: string
  description?: string
  status?: 'scheduled' | 'completed' | 'cancelled'
  start_time?: string
  end_time?: string
  subject?: string
  notes?: string
}

interface LessonsResponse {
  lessons: Lesson[]
  total: number
}

class LessonService {
  /**
   * Get all lessons with optional filters
   * @param filters Optional filters (teacher_id, student_id, status, etc.)
   * @returns List of lessons matching filters
   */
  async getLessons(filters?: Record<string, any>): Promise<LessonsResponse> {
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      const queryString = params.toString()
      const endpoint = queryString ? `/lessons?${queryString}` : '/lessons'
      const response = await apiService.get(endpoint)
      logger.info('Lessons loaded', { filters }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to load lessons', { filters, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Get a specific lesson by ID
   * @param lessonId The lesson ID to fetch
   * @returns Lesson data
   */
  async getLessonById(lessonId: string): Promise<Lesson> {
    try {
      const response = await apiService.get(`/lessons/${lessonId}`)
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to load lesson', { lessonId, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Create a new lesson
   * @param data Lesson creation data
   * @returns Created lesson
   */
  async createLesson(data: CreateLessonRequest): Promise<Lesson> {
    try {
      const response = await apiService.post('/lessons', data)
      logger.info('Lesson created', { title: data.title }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to create lesson', { data, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Update an existing lesson
   * @param lessonId The lesson ID to update
   * @param data Fields to update
   * @returns Updated lesson
   */
  async updateLesson(lessonId: string, data: UpdateLessonRequest): Promise<Lesson> {
    try {
      const response = await apiService.put(`/lessons/${lessonId}`, data)
      logger.info('Lesson updated', { lessonId }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to update lesson', { lessonId, data, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Delete/cancel a lesson
   * @param lessonId The lesson ID to delete
   * @returns Deletion confirmation
   */
  async deleteLesson(lessonId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(`/lessons/${lessonId}`)
      logger.info('Lesson deleted', { lessonId }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to delete lesson', { lessonId, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Get all lessons for a specific teacher
   * @param teacherId The teacher ID
   * @returns Lessons taught by this teacher
   */
  async getLessonsByTeacher(teacherId: string): Promise<LessonsResponse> {
    try {
      const response = await apiService.get(`/teachers/${teacherId}/lessons`)
      logger.info('Teacher lessons loaded', { teacherId }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to load teacher lessons', { teacherId, error: appError }, 'lessonService')
      throw appError
    }
  }

  /**
   * Get all lessons for a specific student
   * @param studentId The student ID
   * @returns Lessons taken by this student
   */
  async getLessonsByStudent(studentId: string): Promise<LessonsResponse> {
    try {
      const response = await apiService.get(`/students/${studentId}/lessons`)
      logger.info('Student lessons loaded', { studentId }, 'lessonService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'lessonService')
      logger.error('Failed to load student lessons', { studentId, error: appError }, 'lessonService')
      throw appError
    }
  }
}

export default new LessonService()
