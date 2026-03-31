import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<{
    id: string
    username?: string
    email: string
    role: string
    firstName?: string
    lastName?: string
    first_name?: string
    last_name?: string
  } | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed(() => currentUser.value?.role || null)
  
  /**
   * User - alias for currentUser for convenience
   */
  const user = computed(() => currentUser.value)

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string | string[]) => {
    if (!currentUser.value) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(currentUser.value.role)
  }

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => hasRole('admin'))

  /**
   * Check if user is teacher
   */
  const isTeacher = computed(() => hasRole('teacher'))

  /**
   * Check if user is student
   */
  const isStudent = computed(() => hasRole('student'))

  /**
   * Login user - stores user data from API response
   */
  const login = (userData: typeof currentUser.value) => {
    currentUser.value = userData
  }

  /**
   * Logout user - clears current user and localStorage
   */
  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
  }

  /**
   * Load user from localStorage (called on app init)
   */
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        logout()
      }
    }
  }

  /**
   * Update current user data
   */
  const updateUser = (userData: Partial<typeof currentUser.value>) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...userData }
      localStorage.setItem('user', JSON.stringify(currentUser.value))
    }
  }

  /**
   * Change user password (called on first login)
   */
  const changePassword = async (newPassword: string) => {
    try {
      const response = await authService.changePassword(newPassword)
      console.log('Password changed successfully')
      return response
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    }
  }

  return {
    currentUser,
    user,
    isAuthenticated,
    userRole,
    isAdmin,
    isTeacher,
    isStudent,
    hasRole,
    login,
    logout,
    loadUserFromStorage,
    updateUser,
  }
})
