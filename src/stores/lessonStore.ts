import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { lessonService } from '@/services'

interface Lesson {
  id: string
  title: string
  description?: string
  date?: string
  content?: string
  [key: string]: any
}

interface CacheEntry {
  data: Lesson[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useLessonStore = defineStore('lesson', () => {
  // State
  const lessons = ref<Lesson[]>([])
  const cache = ref<CacheEntry | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref({
    search: '',
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
   * Fetch all lessons with caching
   */
  const fetchLessons = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (isCacheValid() && !forceRefresh) {
      lessons.value = cache.value!.data
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await lessonService.getAllLessons()
      lessons.value = response
      cache.value = {
        data: response,
        timestamp: Date.now(),
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch lessons'
      lessons.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get single lesson by ID
   */
  const getLessonById = async (id: string) => {
    const cached = lessons.value.find((l) => l.id === id)
    if (cached) return cached

    try {
      const response = await lessonService.getLessonById(id)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch lesson'
      return null
    }
  }

  /**
   * Create new lesson
   */
  const createLesson = async (lessonData: Omit<Lesson, 'id'>) => {
    try {
      const response = await lessonService.createLesson(lessonData)
      lessons.value.push(response)
      // Invalidate cache
      cache.value = null
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create lesson'
      throw err
    }
  }

  /**
   * Update lesson
   */
  const updateLesson = async (id: string, lessonData: Partial<Lesson>) => {
    try {
      const response = await lessonService.updateLesson(id, lessonData)
      const index = lessons.value.findIndex((l) => l.id === id)
      if (index !== -1) {
        lessons.value[index] = response
      }
      // Invalidate cache
      cache.value = null
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update lesson'
      throw err
    }
  }

  /**
   * Delete lesson
   */
  const deleteLesson = async (id: string) => {
    try {
      await lessonService.deleteLesson(id)
      lessons.value = lessons.value.filter((l) => l.id !== id)
      // Invalidate cache
      cache.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete lesson'
      throw err
    }
  }

  /**
   * Apply filters to lessons
   */
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Get filtered lessons
   */
  const filteredLessons = computed(() => {
    return lessons.value.filter((lesson) => {
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        return (
          lesson.title?.toLowerCase().includes(search) ||
          lesson.description?.toLowerCase().includes(search)
        )
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
    lessons,
    loading,
    error,
    filters,
    fetchLessons,
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    setFilters,
    filteredLessons,
    invalidateCache,
    isCacheValid,
  }
})
