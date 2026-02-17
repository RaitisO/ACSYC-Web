import { ref, computed } from 'vue'

/**
 * usePagination Composable
 *
 * Handles pagination, sorting, and item expansion for lists and tables.
 *
 * REPLACES logic in:
 * - AdminApplicationsView.vue:
 *   * expandedApplications state (lines 17-18)
 *   * toggleExpanded() method (lines 45-51)
 *   * Pagination could be added for large application lists
 *
 * Usage examples:
 *
 * 1. Simple expansion state (for accordion-like items):
 *    const { expanded, toggleExpanded, isExpanded } = usePagination()
 *    In template:
 *      @click="toggleExpanded(item.id)"
 *      v-if="isExpanded(item.id)"
 *
 * 2. With pagination:
 *    const { items, pageNum, limit, paginatedItems, nextPage, prevPage, goToPage }
 *      = usePagination({ items: allItems, limit: 10 })
 *    In template:
 *      v-for="item in paginatedItems"
 *      :disabled="pageNum === 1" (prev button)
 *
 * 3. With sorting:
 *    const { sortBy, sortDirection, sortedItems } = usePagination({
 *      items: users,
 *      sortField: 'first_name',
 *      sortDirection: 'asc'
 *    })
 *    @click="sortBy('email')" (click header to sort)
 */

interface PaginationOptions<T> {
  /**
   * Initial items to paginate
   */
  items?: T[]
  /**
   * Items per page (default: 10)
   */
  itemsPerPage?: number
  /**
   * Field to sort by
   */
  sortField?: string
  /**
   * Sort direction: 'asc' or 'desc'
   */
  sortDirection?: 'asc' | 'desc'
}

export function usePagination<T extends { id?: number | string }>(
  options: PaginationOptions<T> = {},
) {
  const {
    items: initialItems = [],
    itemsPerPage = 10,
    sortField,
    sortDirection: initialSortDirection = 'asc',
  } = options

  // Data state
  const items = ref<T[]>(initialItems)

  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(itemsPerPage)

  // Sorting state
  const sortFieldRef = ref<string | null>(sortField || null)
  const sortDirectionRef = ref<'asc' | 'desc'>(initialSortDirection)

  // Expansion state (for accordion-like items)
  const expandedIds = ref<Set<number | string>>(new Set())

  /**
   * Computed: Sorted items
   */
  const sortedItems = computed(() => {
    if (!sortFieldRef.value) return items.value

    return [...items.value].sort((a: any, b: any) => {
      const aVal = a[sortFieldRef.value]
      const bVal = b[sortFieldRef.value]

      if (aVal === bVal) return 0

      let comparison = 0
      if (aVal < bVal) comparison = -1
      else if (aVal > bVal) comparison = 1

      return sortDirectionRef.value === 'asc' ? comparison : -comparison
    })
  })

  /**
   * Computed: Paginated items
   */
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return sortedItems.value.slice(start, end)
  })

  /**
   * Computed: Total pages
   */
  const totalPages = computed(() => {
    return Math.ceil(sortedItems.value.length / pageSize.value)
  })

  /**
   * Computed: Total items
   */
  const totalItems = computed(() => sortedItems.value.length)

  /**
   * Check if an item is expanded
   */
  const isExpanded = (id: number | string): boolean => {
    return expandedIds.value.has(id)
  }

  /**
   * Toggle expansion for an item
   */
  const toggleExpanded = (id: number | string) => {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
  }

  /**
   * Expand an item
   */
  const expand = (id: number | string) => {
    expandedIds.value.add(id)
  }

  /**
   * Collapse an item
   */
  const collapse = (id: number | string) => {
    expandedIds.value.delete(id)
  }

  /**
   * Collapse all items
   */
  const collapseAll = () => {
    expandedIds.value.clear()
  }

  /**
   * Expand all items
   */
  const expandAll = () => {
    paginatedItems.value.forEach((item) => {
      if (item.id) expandedIds.value.add(item.id)
    })
  }

  /**
   * Sort by a field
   * If already sorting by this field, toggle direction
   */
  const sortBy = (field: string) => {
    if (sortFieldRef.value === field) {
      // Toggle direction
      sortDirectionRef.value = sortDirectionRef.value === 'asc' ? 'desc' : 'asc'
    } else {
      // New field, default ascending
      sortFieldRef.value = field
      sortDirectionRef.value = 'asc'
    }
    // Reset to first page when sorting
    currentPage.value = 1
  }

  /**
   * Go to specific page
   */
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages.value || 1))
    currentPage.value = validPage
  }

  /**
   * Next page
   */
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  /**
   * Previous page
   */
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  /**
   * Set items
   */
  const setItems = (newItems: T[]) => {
    items.value = newItems
    currentPage.value = 1 // Reset to first page
  }

  /**
   * Append items
   */
  const appendItems = (newItems: T[]) => {
    items.value = [...items.value, ...newItems]
  }

  /**
   * Reset to initial state
   */
  const reset = () => {
    currentPage.value = 1
    expandedIds.value.clear()
    sortFieldRef.value = sortField || null
    sortDirectionRef.value = initialSortDirection
  }

  return {
    // State
    items,
    currentPage,
    pageSize,
    sortFieldRef,
    sortDirectionRef,
    expandedIds,

    // Computed
    sortedItems,
    paginatedItems,
    totalPages,
    totalItems,

    // Pagination
    goToPage,
    nextPage,
    prevPage,

    // Expansion
    isExpanded,
    toggleExpanded,
    expand,
    collapse,
    expandAll,
    collapseAll,

    // Sorting
    sortBy,

    // Data management
    setItems,
    appendItems,
    reset,
  }
}
