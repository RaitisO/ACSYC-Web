import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services'

interface User {
  id: number | string
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'parent' | 'teacher' | 'admin'
  phone?: string
  date_of_birth?: string
}

/**
 * useAuth Composable
 *
 * Manages authentication state and provides utilities for:
 * - Getting current user from localStorage
 * - User ID access (replaces localStorage.getItem scattered across components)
 * - Role-based checks (isTeacher, isStudent, isAdmin, etc.)
 * - Logout functionality
 * - Auth persistence
 *
 * Usage:
 *   const { currentUser, getCurrentUser, getCurrentUserId, isTeacher } = useAuth()
 */

export function useAuth() {
  const router = useRouter()

  // Reactive current user state (mirrors localStorage)
  const currentUser = ref<User | null>(null)

  // Initialize from localStorage on first access
  const initializeUser = () => {
    if (currentUser.value) return // Already initialized
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        currentUser.value = null
      }
    }
  }

  /**
   * Get current user object
   * Returns null if not logged in
   * Automatically initializes from localStorage on first call
   */
  const getCurrentUser = (): User | null => {
    initializeUser()
    return currentUser.value
  }

  /**
   * Get current user ID as number
   * This replaces the repeated localStorage access pattern throughout the app
   * Returns null if user not found
   */
  const getCurrentUserId = (): number | null => {
    initializeUser()
    if (!currentUser.value) return null
    return typeof currentUser.value.id === 'string'
      ? parseInt(currentUser.value.id, 10)
      : (currentUser.value.id as number)
  }

  /**
   * Set user state after login
   * Updates both reactive ref and localStorage
   */
  const setUser = (user: User) => {
    currentUser.value = user
    localStorage.setItem('user', JSON.stringify(user))
  }

  /**
   * Clear user state on logout
   */
  const clearUser = () => {
    currentUser.value = null
    localStorage.removeItem('user')
  }

  /**
   * Logout user
   * - Calls authService to invalidate session on backend
   * - Clears local state
   * - Redirects to login
   */
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearUser()
      router.push('/login')
    }
  }

  /**
   * Role checks - computed properties for template usage
   * Usage: v-if="isTeacher" or v-if="isAdmin"
   */
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  const isStudent = computed(() => currentUser.value?.role === 'student')
  const isParent = computed(() => currentUser.value?.role === 'parent')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => currentUser.value !== null)

  /**
   * Get user display name
   */
  const getUserDisplayName = (): string => {
    initializeUser()
    if (!currentUser.value) return 'Guest'
    return `${currentUser.value.first_name} ${currentUser.value.last_name}`
  }

  return {
    // Refs
    currentUser,

    // Core methods
    getCurrentUser,
    getCurrentUserId,
    setUser,
    clearUser,
    logout,

    // Role checks
    isTeacher,
    isStudent,
    isParent,
    isAdmin,
    isAuthenticated,

    // Utilities
    getUserDisplayName,
  }
}
