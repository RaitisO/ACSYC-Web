import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for invitations
interface InvitationValidation {
  valid: boolean
  code: string
  teacher_email?: string
}

interface InvitationData {
  valid: boolean
  message?: string
}

class InvitationService {
  /**
   * Validate a teacher invitation code
   * @param code The invitation code to validate
   * @returns Validation result
   */
  async validateCode(code: string): Promise<InvitationValidation> {
    try {
      const response = await apiService.get(`/invitations/${code}`)
      logger.info('Invitation validated', { code }, 'invitationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'invitationService')
      logger.error('Invitation validation failed', { code, error: appError }, 'invitationService')
      throw appError
    }
  }

  /**
   * Create a new teacher invitation
   * @param teacherEmail Email for the teacher invitation
   * @returns Generated invitation code
   */
  async createInvitation(teacherEmail: string): Promise<{ code: string }> {
    try {
      const response = await apiService.post('/invitations', {
        teacher_email: teacherEmail,
      })
      logger.info('Invitation created', { teacherEmail }, 'invitationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'invitationService')
      logger.error('Failed to create invitation', { teacherEmail, error: appError }, 'invitationService')
      throw appError
    }
  }
}

export default new InvitationService()
