import { ref } from 'vue'
import type { Ref } from 'vue'

interface FetchOptions<T> {
  /**
   * Initial value for data ref
   */
  initialValue?: T
  /**
   * Callback when fetch succeeds
   */
  onSuccess?: (data: T) => void
  /**
   * Callback when fetch fails
   */
  onError?: (error: Error) => void
  /**
   * Should fetch immediately on creation? Default: false
   */
  immediate?: boolean
  /**
   * Transform response data before setting it
   */
  transform?: (data: any) => T
}

interface FetchState<T> {
  /**
   * The fetched data
   */
  data: Ref<T>
  /**
   * Loading state while fetching
   */
  isLoading: Ref<boolean>
  /**
   * Error message if fetch failed
   */
  error: Ref<string | null>
  /**
   * Execute the fetch
   */
  fetch: () => Promise<T>
  /**
   * Refetch the data
   */
  refetch: () => Promise<T>
  /**
   * Reset to initial state
   */
  reset: () => void
}

/**
 * useFetch Composable
 *
 * Generic data fetching wrapper that eliminates repetitive fetch logic
 * across the application.
 *
 * REPLACES ~10+ implementations of this pattern:
 * ```
 * const isLoading = ref(false)
 * const data = ref([])
 * const fetchData = async () => {
 *   isLoading.value = true
 *   try {
 *     const response = await service.getData()
 *     data.value = response.data || []
 *   } catch (err) {
 *     error.value = err.message
 *   } finally {
 *     isLoading.value = false
 *   }
 * }
 * ```
 *
 * Usage examples:
 *
 * 1. Basic usage:
 *    const { data, isLoading, error, fetch } = useFetch(
 *      () => userService.getProfile()
 *    )
 *    onMounted(() => fetch())
 *
 * 2. With transformation:
 *    const { data: lessons } = useFetch(
 *      () => lessonService.getLessons({filters}),
 *      {
 *        initialValue: [],
 *        transform: (response) => response.lessons.slice(0, 5) // Top 5 only
 *      }
 *    )
 *
 * 3. With callbacks:
 *    const { data, fetch } = useFetch(
 *      () => applicationService.getApplications(),
 *      {
 *        onSuccess: (data) => console.log('Loaded', data.length, 'items'),
 *        onError: (error) => showNotification('Failed: ' + error.message)
 *      }
 *    )
 *
 * 4. Immediate fetch on mount:
 *    const { data, isLoading } = useFetch(
 *      () => connectionService.getConnections(userId),
 *      { immediate: true }
 *    )
 */

export function useFetch<T = any>(
  fetcher: () => Promise<T>,
  options: FetchOptions<T> = {},
): FetchState<T> {
  const { initialValue, onSuccess, onError, immediate = false, transform } = options

  // Initialize refs
  const data: Ref<T> = ref(initialValue as T)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Execute the fetch
   * - Shows loading state
   * - Handles errors gracefully
   * - Applies transform if provided
   * - Calls onSuccess/onError callbacks
   */
  const fetch = async (): Promise<T> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetcher()
      const result = transform ? transform(response) : response

      // Set data with type safety
      data.value = result
      onSuccess?.(result)
      return result
    } catch (err: any) {
      const errorMessage = err?.message || 'Fetch failed'
      error.value = errorMessage
      onError?.(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Alias for fetch - handles refetching
   */
  const refetch = fetch

  /**
   * Reset to initial state
   */
  const reset = () => {
    data.value = initialValue as T
    error.value = null
    isLoading.value = false
  }

  // Auto-fetch if immediate is true
  if (immediate) {
    fetch()
  }

  return {
    data: data as Ref<T>,
    isLoading,
    error,
    fetch,
    refetch,
    reset,
  }
}
