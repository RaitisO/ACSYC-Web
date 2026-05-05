import apiService from './api'

interface Lesson {
  id: number | string
  teacher_id: number
  student_id: number
  subject_id: number
  start_time: string
  end_time: string
  status: string
  is_recurring: boolean
  teacher_name: string
  student_name: string
  subject_name: string
}

interface Subject {
  id: number
  name: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface CreateLessonRequest {
  teacher_id: number
  student_id: number
  subject_id: number
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern?: string
  recurrence_end_date?: string
  recurrence_interval?: number
}

interface UpdateLessonRequest {
  teacher_id: number
  student_id: number
  subject_id: number
  start_time: string
  end_time: string
  is_recurring: boolean
  status: string
  apply_to?: string
}

interface DropdownData {
  subjects: Subject[]
  teachers: User[]
  students: User[]
}

class LessonService {
  /**
   * Get lessons by date range
   * @param startDate YYYY-MM-DD format
   * @param endDate YYYY-MM-DD format
   * @returns List of lessons
   */
  async getLessonsByDateRange(startDate: string, endDate: string): Promise<Lesson[]> {
    try {
      // Build query string with proper URL encoding
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const response = await apiService.get(`/lessons?${params.toString()}`)
      return response.lessons || []
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
      throw error
    }
  }

  /**
   * Create a new lesson
   * @param data Lesson creation data
   * @returns Created lesson
   */
  async createLesson(data: CreateLessonRequest): Promise<Lesson> {
    try {
      console.log('createLesson: Sending data to server:', data)
      const response = await apiService.post('/lessons', data)
      console.log('createLesson: Server response:', response)
      console.log('createLesson: Response keys:', Object.keys(response || {}))

      // apiService.post returns the parsed JSON directly (not wrapped in response.data)
      if (!response || !response.lesson) {
        console.error('createLesson: Invalid response structure:', response)
        throw new Error('Invalid response from server - missing lesson data')
      }

      return response.lesson
    } catch (error: any) {
      console.error('createLesson: Error occurred:', error)

      // Try to extract more detailed error information
      let errorMessage = 'Unknown error'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status) {
        errorMessage = `Server error (${error.response.status})`
      } else if (error.message) {
        errorMessage = error.message
      }

      console.error('createLesson: Detailed error message:', errorMessage)

      // Re-throw with the original error so it can be caught by the caller
      throw error
    }
  }

  /**
   * Update an existing lesson
   * @param lessonId The lesson ID to update
   * @param data Updated lesson data
   * @param applyToAll Whether to apply changes to all instances (for recurring lessons) - legacy
   * @param applyTo Apply mode: "this", "future", or "all"
   * @returns Success message
   */
  async updateLesson(
    lessonId: string | number,
    data: UpdateLessonRequest,
    applyToAll: boolean = false,
    applyTo: string = 'this',
  ): Promise<any> {
    try {
      // Support legacy parameter
      const mode = applyToAll ? 'all' : applyTo
      const url = `/lessons/${lessonId}?apply_to=${mode}`
      const response = await apiService.put(url, data)
      // apiService.put returns the parsed JSON directly
      return response
    } catch (error) {
      console.error('Failed to update lesson:', error)
      throw error
    }
  }

  /**
   * Delete a lesson
   * @param lessonId The lesson ID to delete
   * @param applyToAll Whether to delete all instances (for recurring lessons) - legacy
   * @param applyTo Delete mode: "this", "future", or "all"
   * @returns Success message
   */
  async deleteLesson(
    lessonId: string | number,
    applyToAll: boolean = false,
    applyTo: string = 'this',
  ): Promise<any> {
    try {
      // Support legacy parameter
      const mode = applyToAll ? 'all' : applyTo
      const url = `/lessons/${lessonId}?apply_to=${mode}`
      const response = await apiService.delete(url)
      // apiService.delete returns the parsed JSON directly
      return response
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      throw error
    }
  }

  /**
   * Get dropdown data (subjects, teachers, students)
   * @returns Dropdown data
   */
  async getDropdownData(): Promise<DropdownData> {
    try {
      const response = await apiService.get('/dropdown-data')
      // apiService.get() already returns the parsed JSON data directly, not wrapped in a response object
      return response
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
      throw error
    }
  }
}

export default new LessonService()
