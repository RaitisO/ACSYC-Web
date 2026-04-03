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
      logger.info('Applications raw response', { data: response.data }, 'applicationService')
      
      // The backend returns { applications: [...], count: ... }
      // But apiService might wrap it, so handle both cases
      const data = response.data || response
      
      if (!data) {
        logger.error('No data in response', { response }, 'applicationService')
        throw new Error('Empty response from server')
      }
      
      logger.info('Applications loaded', { count: data.count || data.applications?.length || 0 }, 'applicationService')
      return data
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

  /**
   * Resend the activation email for an approved application (admin only)
   * @param applicationId The ID of the application/primary student
   * @returns Confirmation that email was resent
   */
  async resendActivationEmail(applicationId: string): Promise<ApprovalResponse> {
    try {
      const response = await apiService.post(`/admin/applications/${applicationId}/resend-activation-email`, {})
      logger.info('Activation email resent', { applicationId }, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to resend activation email', { applicationId, error: appError }, 'applicationService')
      throw appError
    }
  }

  /**
   * Re-approve a rejected application (admin only)
   * Changes status from 'rejected' back to 'approved' and sends activation email
   * @param applicationId The ID of the rejected application
   * @returns Confirmation with new approval details
   */
  async reApproveApplication(applicationId: string): Promise<ApprovalResponse> {
    try {
      logger.info('Re-approving application', { applicationId }, 'applicationService')
      const response = await apiService.post(`/admin/applications/${applicationId}/re-approve`, {})
      logger.info('Application re-approved successfully', { 
        applicationId, 
        message: response.data?.message 
      }, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to re-approve application', { 
        applicationId, 
        error: appError 
      }, 'applicationService')
      throw appError
    }
  }

  /**
   * Delete a single application record (admin only)
   * Permanently removes the application from the system
   * @param applicationId The ID of the application to delete
   * @returns Confirmation of deletion
   */
  async deleteApplication(applicationId: string): Promise<any> {
    try {
      logger.info('Deleting application', { applicationId }, 'applicationService')
      const response = await apiService.delete(`/admin/applications/${applicationId}`)
      logger.info('Application deleted successfully', { 
        applicationId,
        message: response.data?.message 
      }, 'applicationService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to delete application', { 
        applicationId, 
        error: appError 
      }, 'applicationService')
      throw appError
    }
  }

  /**
   * Delete all applications with a given status (admin only)
   * DANGER: This is a bulk delete operation that cannot be undone!
   * @param status The application status to filter by (e.g., 'rejected', 'approved')
   * @returns Confirmation with count of deleted applications
   */
  async deleteAllApplicationsByStatus(status: string): Promise<any> {
    try {
      logger.info('Deleting all applications by status', { status }, 'applicationService')
      const response = await apiService.delete(`/admin/applications/by-status/${status}`)
      logger.info('Bulk deletion completed', { 
        status,
        deleted: response.deleted,
        message: response.message 
      }, 'applicationService')
      return response
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to delete applications by status', { 
        status, 
        error: appError 
      }, 'applicationService')
      throw appError
    }
  }

  /**
   * Activate user accounts using an activation token
   * @param token The activation token from the email link
   * @returns Activation confirmation with account details
   */
  async activateAccounts(token: string): Promise<any> {
    try {
      const response = await apiService.post(`/register/activate/${token}`, {})
      logger.info('Accounts activated successfully', { token: token.substring(0, 10) }, 'applicationService')
      return response
    } catch (error) {
      const appError = errorService.handleError(error, 'applicationService')
      logger.error('Failed to activate accounts', { token: token.substring(0, 10), error: appError }, 'applicationService')
      throw appError
    }
  }
}

export default new ApplicationService()
