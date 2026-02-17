import { ref, computed } from 'vue'
import { connectionService } from '@/services'
import { useAuth } from './useAuth'
import { useFetch } from './useFetch'

interface Connection {
  id: number
  user1_id: number
  user2_id: number
  user1_name: string
  user2_name: string
  user1_role: string
  user2_role: string
  connection_type: string
  created_at: string
  connected_at?: string
}

/**
 * useConnections Composable
 *
 * Manages user connections with role-based filtering.
 *
 * REPLACES connection fetching logic in:
 * - ParentDashboard.vue (lines 30-48)
 * - StudentDashboard.vue (lines 103-113)
 * - TeacherDashboard.vue (lines 124-134)
 * - ConnectionsSection.vue
 *
 * Usage examples:
 *
 * 1. Parent dashboard - get students and teachers:
 *    const { children, teachers, fetch } = useConnections()
 *    onMounted(() => fetch())
 *
 * 2. Student dashboard - get teachers only:
 *    const { filterByRole, fetch } = useConnections()
 *    onMounted(async () => {
 *      await fetch()
 *      const teachers = filterByRole('teacher')
 *    })
 *
 * 3. Teacher dashboard - get students only:
 *    const { students, fetch } = useConnections()
 *    onMounted(() => fetch())
 */

export function useConnections() {
  const { getCurrentUserId } = useAuth()

  const allConnections = ref<Connection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch connections for current user
   */
  const fetchConnections = async () => {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'User not authenticated'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await connectionService.getConnections(userId)
      allConnections.value = response.connections || []
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch connections'
      console.error('Error fetching connections:', err)
      allConnections.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Alias for refetching
   */
  const refetch = fetchConnections

  /**
   * Filter connections by role
   * Returns connections where the OTHER user has the specified role
   */
  const filterByRole = (role: string): Connection[] => {
    const userId = getCurrentUserId()
    if (!userId) return []

    return allConnections.value.filter((conn) => {
      // If current user is user1, check user2's role
      if (conn.user1_id === userId) {
        return conn.user2_role === role
      }
      // If current user is user2, check user1's role
      if (conn.user2_id === userId) {
        return conn.user1_role === role
      }
      return false
    })
  }

  /**
   * Get other user info from connection
   * Handles whether current user is user1 or user2
   */
  const getOtherUserInfo = (conn: Connection) => {
    const userId = getCurrentUserId()
    if (conn.user1_id === userId) {
      return {
        id: conn.user2_id,
        name: conn.user2_name,
        role: conn.user2_role,
      }
    } else {
      return {
        id: conn.user1_id,
        name: conn.user1_name,
        role: conn.user1_role,
      }
    }
  }

  /**
   * Computed properties for filtered connections
   * Usage: v-for="teacher in teachers"
   */
  const teachers = computed(() => filterByRole('teacher'))
  const students = computed(() => filterByRole('student'))
  const parents = computed(() => filterByRole('parent'))
  const children = computed(() => {
    // Children are students connected as user2 (student relationship)
    return allConnections.value.filter((conn) => {
      return conn.user2_role === 'student'
    })
  })

  /**
   * Get formatted connection list with other user info
   */
  const getFormattedConnections = (role?: string): Array<any> => {
    let filtered = allConnections.value
    if (role) {
      filtered = filterByRole(role)
    }

    return filtered.map((conn) => ({
      ...conn,
      otherUserInfo: getOtherUserInfo(conn),
    }))
  }

  /**
   * Check if connected to specific user
   */
  const isConnectedTo = (targetUserId: number): boolean => {
    return allConnections.value.some(
      (conn) =>
        (conn.user1_id === targetUserId || conn.user2_id === targetUserId),
    )
  }

  /**
   * Reset state
   */
  const reset = () => {
    allConnections.value = []
    error.value = null
    isLoading.value = false
  }

  return {
    // Refs
    allConnections,
    isLoading,
    error,

    // Core methods
    fetchConnections,
    refetch,
    reset,

    // Filtering
    filterByRole,
    getOtherUserInfo,
    getFormattedConnections,
    isConnectedTo,

    // Computed properties (pre-filtered)
    teachers,
    students,
    parents,
    children,
  }
}
