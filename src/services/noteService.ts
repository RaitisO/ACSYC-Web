import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for notes
interface UserNote {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface AdminNote {
  id: string
  admin_id: string
  application_id?: string
  student_id?: string
  content: string
  note_type: 'application' | 'general'
  created_at: string
  updated_at: string
}

interface CreateUserNoteRequest {
  title: string
  content: string
}

interface UpdateUserNoteRequest {
  title?: string
  content?: string
}

interface CreateAdminNoteRequest {
  content: string
  note_type: 'application' | 'general'
  application_id?: string
  student_id?: string
}

interface UpdateAdminNoteRequest {
  content?: string
  note_type?: 'application' | 'general'
}

interface NotesResponse {
  notes: UserNote[] | AdminNote[]
  total: number
}

class NoteService {
  /**
   * Get all notes created by a user
   * @param userId The user ID to fetch notes for
   * @returns List of user notes
   */
  async getUserNotes(userId: string): Promise<NotesResponse> {
    try {
      const response = await apiService.get(`/users/${userId}/notes`)
      logger.info('User notes loaded', { userId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to load notes', { userId, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Create a personal note
   * @param data Note creation data
   * @returns Created note
   */
  async createUserNote(data: CreateUserNoteRequest): Promise<UserNote> {
    try {
      const response = await apiService.post('/notes', data)
      logger.info('User note created', { title: data.title }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to create note', { data, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Update a user note
   * @param noteId The note ID to update
   * @param data Fields to update
   * @returns Updated note
   */
  async updateUserNote(noteId: string, data: UpdateUserNoteRequest): Promise<UserNote> {
    try {
      const response = await apiService.put(`/notes/${noteId}`, data)
      logger.info('User note updated', { noteId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to update note', { noteId, data, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Delete a user note
   * @param noteId The note ID to delete
   * @returns Deletion confirmation
   */
  async deleteUserNote(noteId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(`/notes/${noteId}`)
      logger.info('User note deleted', { noteId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to delete note', { noteId, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Get all admin notes created by an admin
   * @param adminId The admin ID to fetch notes for
   * @returns List of admin notes
   */
  async getAdminNotes(adminId: string): Promise<NotesResponse> {
    try {
      const response = await apiService.get(`/admins/${adminId}/notes`)
      logger.info('Admin notes loaded', { adminId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to load admin notes', { adminId, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Create an admin note (for application review, student records, etc.)
   * @param data Admin note creation data
   * @returns Created admin note
   */
  async createAdminNote(data: CreateAdminNoteRequest): Promise<AdminNote> {
    try {
      const response = await apiService.post('/admin/notes', data)
      logger.info('Admin note created', { noteType: data.note_type }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to create admin note', { data, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Update an admin note
   * @param noteId The note ID to update
   * @param data Fields to update
   * @returns Updated admin note
   */
  async updateAdminNote(noteId: string, data: UpdateAdminNoteRequest): Promise<AdminNote> {
    try {
      const response = await apiService.put(`/admin/notes/${noteId}`, data)
      logger.info('Admin note updated', { noteId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to update admin note', { noteId, data, error: appError }, 'noteService')
      throw appError
    }
  }

  /**
   * Delete an admin note
   * @param noteId The note ID to delete
   * @returns Deletion confirmation
   */
  async deleteAdminNote(noteId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(`/admin/notes/${noteId}`)
      logger.info('Admin note deleted', { noteId }, 'noteService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'noteService')
      logger.error('Failed to delete admin note', { noteId, error: appError }, 'noteService')
      throw appError
    }
  }
}

export default new NoteService()
