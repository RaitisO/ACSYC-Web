import { ref, reactive, computed } from 'vue'
import lessonService from '@/services/lessonService'

export interface Lesson {
  id: number | string
  teacher_id: number
  student_id: number
  subject_id: number
  start_time: string
  end_time: string
  status: string
  is_recurring: boolean
  teacher_name: string
  student_name: string
  subject_name: string
}

export interface SelectedLesson {
  id: number | string
  start: string
  end: string
  teacher_id: number
  student_id: number
  subject_id: number
  is_recurring: boolean
  status: string
  teacher_name: string
  student_name: string
  subject_name: string
  applyTo?: string
  templateId?: number | null
}

export interface MovedEventInfo {
  id: string | number
  title: string
  oldStart: string
  oldEnd: string
  newStart: string
  newEnd: string
  isRecurring: boolean
  teacherId: number
  studentId: number
  subjectId: number
  status: string
}

export interface Subject {
  id: number
  name: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

export function useCalendarLessons(getCurrentUserId: () => number | null) {
  // State
  const lessons = ref<Lesson[]>([])
  const subjects = ref<Subject[]>([])
  const teachers = ref<User[]>([])
  const students = ref<User[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const selectedLesson = ref<SelectedLesson | null>(null)
  const selectedTimeSlot = ref({ start: '', end: '' })
  const movedEventInfo = ref<MovedEventInfo | null>(null)

  const newLesson = reactive({
    teacher_id: '',
    student_id: '',
    subject_id: '',
    start: '',
    end: '',
    is_recurring: false,
    recurrence_pattern: 'none',
    recurrence_end_date: '',
    recurrence_interval: 1,
  })

  // Modal state
  const showLessonModal = ref(false)
  const showEditModal = ref(false)
  const showMoveConfirmModal = ref(false)
  const showDeleteConfirmModal = ref(false)

  const isCreatingLesson = ref(false)
  const isUpdatingLesson = ref(false)
  const isDeletingLesson = ref(false)

  const lessonMessage = ref('')
  const editMessage = ref('')

  // Computed
  const recurringOption = ref<'this' | 'all'>('this')

  // Helper functions
  const formatForDateTimeInput = (dateStr: string): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const formatForBackend = (dateTimeStr: string): string => {
    // dateTimeStr is already in local time format from datetime-local input
    // Return as-is without timezone conversion to preserve user's intended time
    // Add :00 for seconds to match backend format "2006-01-02T15:04:05"
    return dateTimeStr + ':00' // Format: "2024-01-16T10:00:00"
  }

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateEndTime = (startTimeStr: string): string => {
    const startTime = new Date(startTimeStr)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    return formatForDateTimeInput(endTime.toISOString())
  }

  // Fetch functions
  const fetchLessons = async (start: Date, end: Date): Promise<Lesson[]> => {
    try {
      isLoading.value = true
      error.value = null

      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const result = await lessonService.getLessonsByDateRange(startStr, endStr)
      lessons.value = result
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch lessons'
      error.value = errorMsg
      console.error('Error fetching lessons:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchDropdownData = async () => {
    try {
      const data = await lessonService.getDropdownData()
      subjects.value = data.subjects || []
      teachers.value = data.teachers || []
      students.value = data.students || []
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
    }
  }

  // Create lesson
  const createLesson = async () => {
    if (!newLesson.student_id || !newLesson.subject_id || !newLesson.start || !newLesson.end) {
      lessonMessage.value = 'Please fill in all fields'
      return
    }

    isCreatingLesson.value = true
    lessonMessage.value = ''

    try {
      const lessonData: any = {
        teacher_id: parseInt(String(newLesson.teacher_id)),
        student_id: parseInt(String(newLesson.student_id)),
        subject_id: parseInt(String(newLesson.subject_id)),
        start_time: formatForBackend(newLesson.start),
        end_time: formatForBackend(newLesson.end),
        is_recurring: newLesson.is_recurring,
      }

      // Add recurrence fields if recurring
      if (newLesson.is_recurring && newLesson.recurrence_pattern !== 'none') {
        lessonData.recurrence_pattern = newLesson.recurrence_pattern
        lessonData.recurrence_end_date = newLesson.recurrence_end_date
        lessonData.recurrence_interval = newLesson.recurrence_interval
      }

      await lessonService.createLesson(lessonData)
      lessonMessage.value = 'Lesson created successfully!'
      resetLessonForm()
      showLessonModal.value = false

      setTimeout(() => {
        lessonMessage.value = ''
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error creating lesson:', err)
      lessonMessage.value = `Error: ${errorMsg}`
    } finally {
      isCreatingLesson.value = false
    }
  }

  // Update lesson
  const updateLesson = async () => {
    if (
      !selectedLesson.value ||
      !selectedLesson.value.start ||
      !selectedLesson.value.end ||
      !selectedLesson.value.student_id ||
      !selectedLesson.value.subject_id
    ) {
      editMessage.value = 'Please fill in all fields'
      return
    }

    if (selectedLesson.value.teacher_id !== getCurrentUserId()) {
      editMessage.value = 'You can only edit your own lessons'
      return
    }

    isUpdatingLesson.value = true
    editMessage.value = ''

    try {
      const applyTo = (selectedLesson.value as any).applyTo || 'this'
      const lessonData = {
        teacher_id: selectedLesson.value.teacher_id,
        student_id: selectedLesson.value.student_id,
        subject_id: selectedLesson.value.subject_id,
        start_time: formatForBackend(selectedLesson.value.start),
        end_time: formatForBackend(selectedLesson.value.end),
        is_recurring: selectedLesson.value.is_recurring,
        status: selectedLesson.value.status,
        apply_to: applyTo,
      }

      await lessonService.updateLesson(selectedLesson.value.id, lessonData, false, applyTo)
      editMessage.value = 'Lesson updated successfully!'
      showEditModal.value = false

      setTimeout(() => {
        editMessage.value = ''
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error updating lesson:', err)
      editMessage.value = `Error: ${errorMsg}`
    } finally {
      isUpdatingLesson.value = false
    }
  }

  // Delete lesson
  const deleteLesson = async (applyToAll: boolean = false, applyTo: string = 'this') => {
    if (!selectedLesson.value || !selectedLesson.value.id) return

    if (selectedLesson.value.teacher_id !== getCurrentUserId()) {
      editMessage.value = 'You can only delete your own lessons'
      return
    }

    // Use applyTo parameter if provided, otherwise default to 'this'
    const mode = applyToAll ? 'all' : applyTo

    isDeletingLesson.value = true
    editMessage.value = ''

    try {
      await lessonService.deleteLesson(selectedLesson.value.id, false, mode)
      editMessage.value = 'Lesson deleted successfully!'
      showEditModal.value = false
      showDeleteConfirmModal.value = false

      setTimeout(() => {
        editMessage.value = ''
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error deleting lesson:', err)
      editMessage.value = `Error: ${errorMsg}`
    } finally {
      isDeletingLesson.value = false
    }
  }

  // Move/Update event from drag
  const confirmEventMove = async (applyToAll: boolean = false) => {
    if (!movedEventInfo.value) return

    isUpdatingLesson.value = true

    try {
      const lessonData = {
        teacher_id: movedEventInfo.value.teacherId,
        student_id: movedEventInfo.value.studentId,
        subject_id: movedEventInfo.value.subjectId,
        start_time: formatForBackend(movedEventInfo.value.newStart),
        end_time: formatForBackend(movedEventInfo.value.newEnd),
        is_recurring: movedEventInfo.value.isRecurring,
        status: movedEventInfo.value.status,
      }

      await lessonService.updateLesson(movedEventInfo.value.id, lessonData, applyToAll)
      showMoveConfirmModal.value = false
      movedEventInfo.value = null
    } catch (err) {
      console.error('Error moving lesson:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to move lesson: ${errorMsg}`)
    } finally {
      isUpdatingLesson.value = false
    }
  }

  // Modal handlers
  const handleDateSelect = (start: string, end: string) => {
    selectedTimeSlot.value = { start, end }
    newLesson.teacher_id = String(getCurrentUserId() || '')
    newLesson.start = start
    newLesson.end = end
    showLessonModal.value = true
  }

  const handleEventClick = (lesson: Lesson, isOwned: boolean) => {
    if (isOwned) {
      selectedLesson.value = {
        id: lesson.id,
        start: formatForDateTimeInput(lesson.start_time),
        end: formatForDateTimeInput(lesson.end_time),
        teacher_id: lesson.teacher_id,
        student_id: lesson.student_id,
        subject_id: lesson.subject_id,
        is_recurring: lesson.is_recurring,
        status: lesson.status,
        teacher_name: lesson.teacher_name,
        student_name: lesson.student_name,
        subject_name: lesson.subject_name,
        applyTo: 'this',
        templateId: (lesson as any).template_id || null,
      }
      showEditModal.value = true
    }
  }

  const handleEventDrop = (
    eventId: string | number,
    title: string,
    oldStart: string,
    oldEnd: string,
    newStart: string,
    newEnd: string,
    isRecurring: boolean,
    teacherId: number,
    studentId: number,
    subjectId: number,
    status: string,
  ) => {
    movedEventInfo.value = {
      id: eventId,
      title,
      oldStart,
      oldEnd,
      newStart,
      newEnd,
      isRecurring,
      teacherId,
      studentId,
      subjectId,
      status,
    }
    recurringOption.value = 'this'
    showMoveConfirmModal.value = true
  }

  const resetLessonForm = () => {
    newLesson.teacher_id = String(getCurrentUserId() || '')
    newLesson.student_id = ''
    newLesson.subject_id = ''
    newLesson.start = ''
    newLesson.end = ''
    newLesson.is_recurring = false
    newLesson.recurrence_pattern = 'none'
    newLesson.recurrence_end_date = ''
    newLesson.recurrence_interval = 1
    lessonMessage.value = ''
  }

  const closeModal = () => {
    showLessonModal.value = false
    resetLessonForm()
  }

  const closeEditModal = () => {
    showEditModal.value = false
    editMessage.value = ''
  }

  const closeDeleteConfirmModal = () => {
    showDeleteConfirmModal.value = false
  }

  const closeMoveConfirmModal = () => {
    showMoveConfirmModal.value = false
    movedEventInfo.value = null
  }

  const openDeleteConfirmModal = () => {
    showEditModal.value = false
    showDeleteConfirmModal.value = true
  }

  return {
    // State
    lessons,
    subjects,
    teachers,
    students,
    isLoading,
    error,
    selectedLesson,
    selectedTimeSlot,
    movedEventInfo,
    newLesson,
    recurringOption,

    // Modal state
    showLessonModal,
    showEditModal,
    showMoveConfirmModal,
    showDeleteConfirmModal,
    isCreatingLesson,
    isUpdatingLesson,
    isDeletingLesson,
    lessonMessage,
    editMessage,

    // Methods
    fetchLessons,
    fetchDropdownData,
    createLesson,
    updateLesson,
    deleteLesson,
    confirmEventMove,
    handleDateSelect,
    handleEventClick,
    handleEventDrop,
    resetLessonForm,
    closeModal,
    closeEditModal,
    closeDeleteConfirmModal,
    closeMoveConfirmModal,
    openDeleteConfirmModal,

    // Helpers
    formatForDateTimeInput,
    formatForBackend,
    formatDateTime,
    calculateEndTime,
  }
}
