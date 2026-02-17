import { ref, computed } from 'vue'

interface ModalOptions<T = any> {
  /**
   * Initial data for the modal
   */
  initialData?: T
  /**
   * Auto-clear message after N milliseconds
   * Set to 0 to disable auto-clear
   */
  autoClosureTime?: number
  /**
   * Callback when modal opens
   */
  onOpen?: (data?: T) => void
  /**
   * Callback when modal closes
   */
  onClose?: () => void
  /**
   * Callback when modal is confirmed/submitted
   */
  onConfirm?: (data?: T) => void
}

/**
 * useModal Composable
 *
 * Manages modal/dialog state with built-in features:
 * - Open/close state
 * - Modal data/context
 * - Status messages with auto-clear
 * - Confirmation handling
 *
 * REPLACES modal logic in:
 * - AdminDashboard.vue (4+ modals):
 *   * showColorPickerModal + selectedTeacherForColor + colorPickerMessage (30 lines)
 *   * showLessonModal + selectedTimeSlot + newLesson + lessonMessage (25 lines)
 *   * showEditModal + selectedLesson + editMessage (20 lines)
 *   * showMoveConfirmModal + movedEventInfo + moveMessage (20 lines)
 * - TeacherDashboard.vue (similar modal management)
 *
 * Current AdminDashboard problems:
 * - Lines 1-60: 60 lines just for modal ref declarations
 * - Lines 140-200: 60 lines for open/close modal methods
 * - Repeated message auto-clearing logic (4 times)
 *
 * Usage examples:
 *
 * 1. Simple color picker modal:
 *    const colorModal = useModal({ initialData: { color: '#ffffff' } })
 *    const openColorPicker = (teacher) => {
 *      colorModal.open({ ...colorModal.data.value, teacher })
 *    }
 *    In template: v-if="colorModal.isOpen"
 *
 * 2. Modal with auto-clearing message:
 *    const lessonModal = useModal({ autoClosureTime: 3000 })
 *    const submitLesson = async () => {
 *      try {
 *        await api.createLesson(lessonModal.data.value)
 *        lessonModal.setMessage('Lesson created!', 'success')
 *      } catch (e) {
 *        lessonModal.setMessage('Failed: ' + e.message, 'error')
 *      }
 *    }
 *
 * 3. Modal with confirmation:
 *    const confirmModal = useModal({
 *      onConfirm: async (data) => {
 *        await api.approve(data.id)
 *        confirmModal.close()
 *      }
 *    })
 */

interface ModalMessage {
  text: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
}

export function useModal<T = any>(options: ModalOptions<T> = {}) {
  const { initialData, autoClosureTime = 3000, onOpen, onClose, onConfirm } = options

  // State
  const isOpen = ref(false)
  const data = ref<T>(initialData as T)
  const message = ref<ModalMessage | null>(null)
  const isProcessing = ref(false)
  let autoClearTimeout: NodeJS.Timeout | null = null

  /**
   * Get message text (for template usage)
   */
  const messageText = computed(() => message.value?.text || '')

  /**
   * Get message type (for CSS classes)
   */
  const messageType = computed(() => message.value?.type || 'info')

  /**
   * Check if there's a message to display
   */
  const hasMessage = computed(() => message.value !== null)

  /**
   * Open the modal
   * @param newData Optional new data to set before opening
   */
  const open = (newData?: Partial<T>) => {
    if (newData) {
      data.value = { ...data.value, ...newData }
    }
    isOpen.value = true
    message.value = null
    onOpen?.(data.value)
  }

  /**
   * Close the modal
   */
  const close = () => {
    isOpen.value = false
    clearMessage()
    onClose?.()
  }

  /**
   * Set data without opening
   */
  const setData = (newData: Partial<T>) => {
    data.value = { ...data.value, ...newData }
  }

  /**
   * Reset data to initial state
   */
  const resetData = () => {
    data.value = initialData as T
  }

  /**
   * Set message with auto-clear
   * @param text Message text
   * @param type Message type: 'success' | 'error' | 'info' | 'warning'
   */
  const setMessage = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    // Clear previous timeout
    if (autoClearTimeout) {
      clearTimeout(autoClearTimeout)
    }

    message.value = {
      text,
      type,
      timestamp: Date.now(),
    }

    // Auto-clear message if enabled
    if (autoClosureTime > 0) {
      autoClearTimeout = setTimeout(() => {
        message.value = null
      }, autoClosureTime)
    }
  }

  /**
   * Clear message immediately
   */
  const clearMessage = () => {
    if (autoClearTimeout) {
      clearTimeout(autoClearTimeout)
    }
    message.value = null
  }

  /**
   * Handle confirmation
   * Calls onConfirm callback if provided
   */
  const confirm = async () => {
    isProcessing.value = true
    try {
      await onConfirm?.(data.value)
    } catch (error: any) {
      console.error('Confirmation error:', error)
      setMessage(error?.message || 'Action failed', 'error')
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Toggle modal open/closed
   */
  const toggle = (newData?: Partial<T>) => {
    if (isOpen.value) {
      close()
    } else {
      open(newData)
    }
  }

  /**
   * Reset everything to initial state
   */
  const reset = () => {
    resetData()
    clearMessage()
    isOpen.value = false
    isProcessing.value = false
  }

  return {
    // State
    isOpen,
    data,
    message,
    isProcessing,

    // Computed
    messageText,
    messageType,
    hasMessage,

    // Methods
    open,
    close,
    toggle,
    setData,
    resetData,
    reset,

    // Message handling
    setMessage,
    clearMessage,

    // Confirmation
    confirm,
  }
}

/**
 * Create multiple modals management object
 *
 * Usage:
 *   const modals = useModals({
 *     color: { initialData: { color: '#fff' } },
 *     lesson: { autoClosureTime: 3000 },
 *     confirm: { autoClosureTime: 0 }
 *   })
 *   modals.color.open()
 *   modals.lesson.setMessage('Success!')
 */
export function useModals<T extends Record<string, ModalOptions>>(
  modalConfigs: T,
): Record<keyof T, ReturnType<typeof useModal>> {
  const modals = {} as Record<keyof T, ReturnType<typeof useModal>>

  for (const [key, config] of Object.entries(modalConfigs)) {
    modals[key as keyof T] = useModal(config)
  }

  return modals
}
