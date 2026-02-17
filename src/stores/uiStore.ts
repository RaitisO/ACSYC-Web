import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Modal {
  name: string
  isOpen: boolean
  data?: any
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useUiStore = defineStore('ui', () => {
  // State
  const modals = ref<Map<string, Modal>>(new Map())
  const notifications = ref<Notification[]>([])
  const sidebar = ref({
    isOpen: true,
  })
  const theme = ref<'light' | 'dark'>('light')

  /**
   * Register or update a modal state
   */
  const registerModal = (name: string, initialState = { isOpen: false, data: null }) => {
    modals.value.set(name, initialState)
  }

  /**
   * Open modal with optional data
   */
  const openModal = (name: string, data?: any) => {
    const modal = modals.value.get(name)
    if (modal) {
      modal.isOpen = true
      modal.data = data
    } else {
      modals.value.set(name, { name, isOpen: true, data })
    }
  }

  /**
   * Close modal
   */
  const closeModal = (name: string) => {
    const modal = modals.value.get(name)
    if (modal) {
      modal.isOpen = false
      modal.data = null
    }
  }

  /**
   * Check if modal is open
   */
  const isModalOpen = (name: string): boolean => {
    const modal = modals.value.get(name)
    return modal?.isOpen ?? false
  }

  /**
   * Get modal data
   */
  const getModalData = (name: string) => {
    return modals.value.get(name)?.data || null
  }

  /**
   * Close all modals
   */
  const closeAllModals = () => {
    modals.value.forEach((modal) => {
      modal.isOpen = false
      modal.data = null
    })
  }

  /**
   * Add notification
   */
  const addNotification = (
    message: string,
    type: Notification['type'] = 'info',
    duration = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    const notification: Notification = { id, message, type, duration }

    notifications.value.push(notification)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  /**
   * Show success notification
   */
  const showSuccess = (message: string, duration = 5000) => {
    return addNotification(message, 'success', duration)
  }

  /**
   * Show error notification
   */
  const showError = (message: string, duration = 5000) => {
    return addNotification(message, 'error', duration)
  }

  /**
   * Show warning notification
   */
  const showWarning = (message: string, duration = 5000) => {
    return addNotification(message, 'warning', duration)
  }

  /**
   * Show info notification
   */
  const showInfo = (message: string, duration = 5000) => {
    return addNotification(message, 'info', duration)
  }

  /**
   * Remove notification by ID
   */
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Toggle sidebar
   */
  const toggleSidebar = () => {
    sidebar.value.isOpen = !sidebar.value.isOpen
  }

  /**
   * Set sidebar state
   */
  const setSidebarOpen = (isOpen: boolean) => {
    sidebar.value.isOpen = isOpen
  }

  /**
   * Toggle theme
   */
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  /**
   * Set theme
   */
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
  }

  /**
   * Computed: get all modals as array
   */
  const allModals = computed(() => {
    return Array.from(modals.value.values())
  })

  /**
   * Computed: get open modals count
   */
  const openModalsCount = computed(() => {
    return Array.from(modals.value.values()).filter((m) => m.isOpen).length
  })

  return {
    modals,
    notifications,
    sidebar,
    theme,
    registerModal,
    openModal,
    closeModal,
    isModalOpen,
    getModalData,
    closeAllModals,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    setTheme,
    allModals,
    openModalsCount,
  }
})
