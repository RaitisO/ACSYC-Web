import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for applications
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  role: string
  application_status: string
  created_at: string
}

interface ApplicationGroup {
  primary_member_id: string
  primary_member_name: string
  application_date: string
  members: User[]
}

interface ApplicationsResponse {
  applications: ApplicationGroup[]
}

interface ApprovalResponse {
  success: boolean
  message: string
}

class ApplicationService {
  /**
   * Get all pending student applications (admin only)
   * @returns List of pending applications grouped by family
   */
  async getApplications(): Promise<ApplicationsResponse> {
    try {
      const response = await apiService.get('/admin/applications')
      logger.info('Applications loaded', undefined, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to load applications', { error: appError }, 'applicationService')
      throw appError
    }
  }

  /**
   * Approve a pending student/family application (admin only)
   * @param studentId The ID of the primary student to approve
   * @returns Approval confirmation
   */
  async approveApplication(studentId: string): Promise<ApprovalResponse> {
    try {
      const response = await apiService.post(`/admin/applications/${studentId}/approve`, {})
      logger.info('Application approved', { studentId }, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to approve application', { studentId, error: appError }, 'applicationService')
      throw appError
    }
  }

  /**
   * Reject a pending student/family application (admin only)
   * @param studentId The ID of the primary student to reject
   * @returns Rejection confirmation
   */
  async rejectApplication(studentId: string): Promise<ApprovalResponse> {
    try {
      const response = await apiService.post(`/admin/applications/${studentId}/reject`, {})
      logger.info('Application rejected', { studentId }, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to reject application', { studentId, error: appError }, 'applicationService')
      throw appError
    }
  }
}

export default new ApplicationService()
