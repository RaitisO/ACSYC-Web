import apiService from './api'
import { errorService } from './errorService'
import { logger } from '@/utils/logger'

// Type definitions for connections
interface Connection {
  id: string
  user1_id: string
  user2_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

interface ConnectionRequest {
  target_user_id: string
}

interface ConnectionsResponse {
  connections: Connection[]
  total: number
}

interface ConnectionStatusResponse {
  status: 'connected' | 'pending' | 'not_connected' | 'rejected'
}

class ConnectionService {
  /**
   * Get all connections for a user
   * @param userId The user ID to fetch connections for
   * @returns List of connections
   */
  async getConnections(userId: string): Promise<ConnectionsResponse> {
    try {
      const response = await apiService.get(`/users/${userId}/connections`)
      logger.info('Connections loaded', { userId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to load connections', { userId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Request a connection with another user
   * @param targetUserId The ID of the user to connect with
   * @returns Connection request confirmation
   */
  async requestConnection(targetUserId: string): Promise<Connection> {
    try {
      const response = await apiService.post('/connections', {
        target_user_id: targetUserId,
      })
      logger.info('Connection requested', { targetUserId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to request connection', { targetUserId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Accept a pending connection request
   * @param connectionId The connection ID to accept
   * @returns Updated connection
   */
  async acceptConnection(connectionId: string): Promise<Connection> {
    try {
      const response = await apiService.put(`/connections/${connectionId}/accept`, {})
      logger.info('Connection accepted', { connectionId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to accept connection', { connectionId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Reject a pending connection request
   * @param connectionId The connection ID to reject
   * @returns Updated connection
   */
  async rejectConnection(connectionId: string): Promise<Connection> {
    try {
      const response = await apiService.put(`/connections/${connectionId}/reject`, {})
      logger.info('Connection rejected', { connectionId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to reject connection', { connectionId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Remove an existing connection
   * @param connectionId The connection ID to remove
   * @returns Removal confirmation
   */
  async removeConnection(connectionId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiService.delete(`/connections/${connectionId}`)
      logger.info('Connection removed', { connectionId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to remove connection', { connectionId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Get pending connection requests for a user
   * @param userId The user ID to fetch pending requests for
   * @returns List of pending connections
   */
  async getPendingConnections(userId: string): Promise<ConnectionsResponse> {
    try {
      const response = await apiService.get(`/users/${userId}/connections/pending`)
      logger.info('Pending connections loaded', { userId }, 'connectionService')
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to load pending connections', { userId, error: appError }, 'connectionService')
      throw appError
    }
  }

  /**
   * Check connection status between two users
   * @param user1Id First user ID
   * @param user2Id Second user ID
   * @returns Connection status
   */
  async getConnectionStatus(user1Id: string, user2Id: string): Promise<ConnectionStatusResponse> {
    try {
      const response = await apiService.get(`/connections/status/${user1Id}/${user2Id}`)
      return response.data
    } catch (error) {
      const appError = errorService.handleError(error, 'connectionService')
      logger.error('Failed to check connection status', { user1Id, user2Id, error: appError }, 'connectionService')
      throw appError
    }
  }
}

export default new ConnectionService()
