import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { connectionService } from '@/services'
import { useUserStore } from './userStore'

interface Connection {
  id: string
  name: string
  email?: string
  role?: string
  status?: string
  [key: string]: any
}

interface CacheEntry {
  data: Connection[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useConnectionStore = defineStore('connection', () => {
  // State
  const connections = ref<Connection[]>([])
  const cache = ref<CacheEntry | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref({
    search: '',
    role: 'all' as string,
    status: 'all' as string,
  })

  /**
   * Check if cache is still valid
   */
  const isCacheValid = (): boolean => {
    if (!cache.value) return false
    return Date.now() - cache.value.timestamp < CACHE_DURATION
  }

  /**
   * Fetch all connections with caching and role-based filtering
   */
  const fetchConnections = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (isCacheValid() && !forceRefresh) {
      connections.value = cache.value!.data
      return
    }

    loading.value = true
    error.value = null
    const userStore = useUserStore()

    try {
      const response = await connectionService.getConnections()
      // Filter connections based on user role
      let filtered = response

      if (userStore.isTeacher) {
        // Teachers can see their students
        filtered = response.filter((c) => c.role === 'student')
      } else if (userStore.isStudent) {
        // Students can see their teachers
        filtered = response.filter((c) => c.role === 'teacher')
      }

      connections.value = filtered
      cache.value = {
        data: filtered,
        timestamp: Date.now(),
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch connections'
      connections.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get single connection by ID
   */
  const getConnectionById = async (id: string) => {
    const cached = connections.value.find((c) => c.id === id)
    if (cached) return cached

    try {
      const response = await connectionService.getConnectionById(id)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch connection'
      return null
    }
  }

  /**
   * Create new connection
   */
  const createConnection = async (connectionData: Omit<Connection, 'id'>) => {
    try {
      const response = await connectionService.createConnection(connectionData)
      connections.value.push(response)
      // Invalidate cache
      cache.value = null
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create connection'
      throw err
    }
  }

  /**
   * Update connection
   */
  const updateConnection = async (id: string, connectionData: Partial<Connection>) => {
    try {
      const response = await connectionService.updateConnection(id, connectionData)
      const index = connections.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        connections.value[index] = response
      }
      // Invalidate cache
      cache.value = null
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update connection'
      throw err
    }
  }

  /**
   * Delete connection
   */
  const deleteConnection = async (id: string) => {
    try {
      await connectionService.deleteConnection(id)
      connections.value = connections.value.filter((c) => c.id !== id)
      // Invalidate cache
      cache.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete connection'
      throw err
    }
  }

  /**
   * Apply filters to connections
   */
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Get filtered connections
   */
  const filteredConnections = computed(() => {
    return connections.value.filter((connection) => {
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        if (
          !connection.name?.toLowerCase().includes(search) &&
          !connection.email?.toLowerCase().includes(search)
        ) {
          return false
        }
      }

      if (filters.value.role !== 'all' && connection.role !== filters.value.role) {
        return false
      }

      if (filters.value.status !== 'all' && connection.status !== filters.value.status) {
        return false
      }

      return true
    })
  })

  /**
   * Invalidate cache manually
   */
  const invalidateCache = () => {
    cache.value = null
  }

  return {
    connections,
    loading,
    error,
    filters,
    fetchConnections,
    getConnectionById,
    createConnection,
    updateConnection,
    deleteConnection,
    setFilters,
    filteredConnections,
    invalidateCache,
    isCacheValid,
  }
})
