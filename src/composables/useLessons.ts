import { ref, computed } from 'vue'
import { lessonService } from '@/services'
import { useAuth } from './useAuth'

interface Lesson {
  id: number
  teacher_name: string
  teacher_id?: number
  subject_name: string
  subject_id?: number
  start_time: string
  end_time: string
  status: string
  isRecurring?: boolean
  studentId?: number
}

interface FormattedDateTime {
  date: string
  time: string
  fullDateTime: string
}

/**
 * useLessons Composable
 *
 * Manages lesson data fetching, filtering, and formatting.
 *
 * REPLACES logic in:
 * - StudentDashboard.vue (lines 50-75) - lesson fetching and formatDateTime
 * - TeacherDashboard.vue - lesson fetching
 * - formatDateTime function (appears in 2+ places)
 *
 * Usage examples:
 *
 * 1. Get upcoming lessons for student:
 *    const { upcomingLessons, fetch } = useLessons()
 *    onMounted(() => fetch({ days: 30 }))
 *
 * 2. Get lessons in date range:
 *    const { lessons, fetch } = useLessons()
 *    onMounted(() => fetch({
 *      startDate: '2024-01-01',
 *      endDate: '2024-01-31'
 *    }))
 *
 * 3. Access formatted lesson times:
 *    const { formatDateTime } = useLessons()
 *    const { date, time } = formatDateTime(lesson.start_time)
 */

export function useLessons() {
  const { getCurrentUserId } = useAuth()

  const lessons = ref<Lesson[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Format ISO datetime string into readable parts
   * Replaces the formatDateTime functions scattered throughout components
   */
  const formatDateTime = (isoString: string): FormattedDateTime => {
    const date = new Date(isoString)

    // Format date as "Mon, Jan 1"
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

    // Format time as "2:30 PM"
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    // Full formatted datetime
    const fullDateTime = `${dateStr} at ${timeStr}`

    return { date: dateStr, time: timeStr, fullDateTime }
  }

  /**
   * Fetch lessons with optional filters
   */
  const fetchLessons = async (options?: {
    days?: number // Next N days (default: 30)
    startDate?: string // ISO date string
    endDate?: string // ISO date string
  }) => {
    isLoading.value = true
    error.value = null

    try {
      // Calculate date range
      let startDate = ''
      let endDate = ''

      if (options?.startDate && options?.endDate) {
        // Use provided dates
        startDate = options.startDate
        endDate = options.endDate
      } else {
        // Calculate from today + N days (default 30)
        const today = new Date()
        startDate = today.toISOString().split('T')[0]

        const futureDate = new Date(
          today.getTime() + (options?.days || 30) * 24 * 60 * 60 * 1000,
        )
        endDate = futureDate.toISOString().split('T')[0]
      }

      // Fetch from service
      const response = await lessonService.getLessons({
        start_date: startDate,
        end_date: endDate,
      })

      // Sort by start time
      lessons.value = (response.lessons || []).sort(
        (a: Lesson, b: Lesson) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch lessons'
      console.error('Error fetching lessons:', err)
      lessons.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Alias for refetching
   */
  const refetch = fetchLessons

  /**
   * Get upcoming lessons (next N)
   */
  const getUpcomingLessons = (limit: number = 5): Lesson[] => {
    return lessons.value.slice(0, limit)
  }

  /**
   * Filter lessons by teacher
   */
  const filterByTeacher = (teacherId: number): Lesson[] => {
    return lessons.value.filter((lesson) => lesson.teacher_id === teacherId)
  }

  /**
   * Filter lessons by subject
   */
  const filterBySubject = (subjectId: number): Lesson[] => {
    return lessons.value.filter((lesson) => lesson.subject_id === subjectId)
  }

  /**
   * Filter lessons by status
   */
  const filterByStatus = (status: string): Lesson[] => {
    return lessons.value.filter((lesson) => lesson.status === status)
  }

  /**
   * Check if lesson is coming up soon (within next 24 hours)
   */
  const isLessonSoon = (lesson: Lesson): boolean => {
    const lessonTime = new Date(lesson.start_time).getTime()
    const now = new Date().getTime()
    const secondsUntilLesson = (lessonTime - now) / 1000

    // Lesson is "soon" if within 24 hours from now
    return secondsUntilLesson > 0 && secondsUntilLesson < 24 * 60 * 60
  }

  /**
   * Group lessons by date
   */
  const groupByDate = (): Map<string, Lesson[]> => {
    const grouped = new Map<string, Lesson[]>()

    lessons.value.forEach((lesson) => {
      const { date } = formatDateTime(lesson.start_time)
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(lesson)
    })

    return grouped
  }

  /**
   * Computed property for upcoming lessons
   */
  const upcomingLessons = computed(() => getUpcomingLessons(5))

  /**
   * Check if has any lessons
   */
  const hasLessons = computed(() => lessons.value.length > 0)

  /**
   * Reset state
   */
  const reset = () => {
    lessons.value = []
    error.value = null
    isLoading.value = false
  }

  return {
    // Refs
    lessons,
    isLoading,
    error,

    // Core methods
    fetchLessons,
    refetch,
    reset,

    // Formatting
    formatDateTime,

    // Filtering
    getUpcomingLessons,
    filterByTeacher,
    filterBySubject,
    filterByStatus,
    isLessonSoon,
    groupByDate,

    // Computed
    upcomingLessons,
    hasLessons,
  }
}
