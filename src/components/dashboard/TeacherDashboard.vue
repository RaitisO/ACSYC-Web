<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ConnectionsSection from '@/components/ConnectionsSection.vue'
import ProfileSection from '@/components/ProfileSection.vue'

defineOptions({
  name: 'TeacherDashboard',
})

interface ConnectedStudent {
  id: number
  first_name: string
  last_name: string
  role: string
  email: string
}

interface SelectedLesson {
  id: number | string
  title: string
  start: string
  end: string
  teacherId: number
  studentId: number
  subjectId: number
  isRecurring: boolean
  status: string
  teacherName: string
  studentName: string
  subjectName: string
  isOwned: boolean
}

const currentView = ref<'main' | 'students' | 'calendar' | 'subjects' | 'connections' | 'profile'>(
  'main',
)
const connectedStudents = ref<ConnectedStudent[]>([])
const isLoading = ref(false)
const subjects = ref<Array<{ id: number; name: string }>>([]) // Dynamic subjects from API

// Calendar state
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const showEditModal = ref(false)
const selectedLesson = ref<SelectedLesson | null>(null)
const editMessage = ref('')
const isUpdatingLesson = ref(false)
const isDeletingLesson = ref(false)
const showLessonModal = ref(false)
const lessonMessage = ref('')
const isCreatingLesson = ref(false)
const selectedTimeSlot = ref({ start: '', end: '' })
const newLesson = ref({
  teacher: '',
  student: '',
  subject: '',
  start: '',
  end: '',
  isRecurring: false,
})
const showMoveConfirmModal = ref(false)
const movedEventInfo = ref<{
  id: string
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
} | null>(null)
const recurringOption = ref<'this' | 'all'>('this')

// Get current user from localStorage
const getCurrentUserId = (): number | null => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  const user = JSON.parse(storedUser)
  const userId = parseInt(user.id, 10)
  console.log('Current user ID:', userId, 'Full user:', user, 'user.id type:', typeof user.id)
  return userId
}

// Navigation functions
const showStudents = () => {
  currentView.value = 'students'
  fetchConnectedUsers()
}
const showCalendar = () => {
  currentView.value = 'calendar'
  // Calendar will auto-fetch on datesSet when mounted
}
const showSubjects = () => (currentView.value = 'subjects')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch connected students
const fetchConnectedUsers = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:8080/api/connected-users', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch connected users')

    const data = (await response.json()) as { connected_users: ConnectedStudent[] }
    // Filter to only show students for teachers
    connectedStudents.value = data.connected_users.filter((user) => user.role === 'student')
  } catch (error) {
    console.error('Error fetching connected users:', error)
    connectedStudents.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch dropdown data (subjects) from backend
const fetchDropdownData = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/dropdown-data', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch dropdown data')

    const data = (await response.json()) as { subjects: Array<{ id: number; name: string }> }
    subjects.value = data.subjects || []
    console.log('Subjects loaded:', subjects.value)
  } catch (error) {
    console.error('Error fetching dropdown data:', error)
    subjects.value = []
  }
}

// Fetch teacher's lessons and their connected students' lessons with date range
const fetchTeacherCalendarLessons = async (start: Date, end: Date) => {
  try {
    const teacherId = getCurrentUserId()
    if (!teacherId) return

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const response = await fetch(
      `http://localhost:8080/api/lessons?start_date=${startStr}&end_date=${endStr}`,
      {
        credentials: 'include',
      },
    )

    if (!response.ok) throw new Error('Failed to fetch lessons')

    interface Lesson {
      id: number
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

    const data = (await response.json()) as { lessons: Lesson[] }
    const allLessons = data.lessons || []

    // Filter lessons:
    // 1. Lessons taught by this teacher (can edit/delete these)
    // 2. Lessons for students connected to this teacher (can only view these)
    const teacherLessons = allLessons.filter((lesson) => {
      const isTeacherLesson = lesson.teacher_id === teacherId
      const isStudentConnectedLesson = connectedStudents.value.some(
        (student) => student.id === lesson.student_id,
      )
      return isTeacherLesson || isStudentConnectedLesson
    })

    // Convert to calendar events with different colors
    const events = teacherLessons.map((lesson) => {
      const teacherIdNum = parseInt(String(lesson.teacher_id), 10)
      const currentTeacherNum = teacherId || 0
      const isOwned = teacherIdNum === currentTeacherNum
      console.log(
        `Lesson ${lesson.id}: teacher_id=${teacherIdNum} (type: ${typeof teacherIdNum}), currentTeacherId=${currentTeacherNum} (type: ${typeof currentTeacherNum}), isOwned=${isOwned}`,
      )
      return {
        id: lesson.id.toString(),
        title: isOwned
          ? `${lesson.subject_name}"\n"${lesson.student_name}`
          : `${lesson.teacher_name} - ${lesson.subject_name}"\n"${lesson.student_name}`,
        start: lesson.start_time,
        end: lesson.end_time,
        backgroundColor: isOwned ? '#38aad9' : '#6c757d', // Own lessons blue, others gray
        borderColor: isOwned ? '#2a8fc7' : '#5a6268',
        editable: isOwned, // Can edit only own lessons
        extendedProps: {
          teacherId: lesson.teacher_id,
          studentId: lesson.student_id,
          subjectId: lesson.subject_id,
          studentName: lesson.student_name,
          teacherName: lesson.teacher_name,
          subjectName: lesson.subject_name,
          status: lesson.status,
          isRecurring: lesson.is_recurring,
          isOwned: isOwned,
        },
      }
    })

    const calendarApi = getCalendarApi()
    if (calendarApi) {
      calendarApi.removeAllEvents()
      calendarApi.addEventSource([
        ...generateBreakPeriods(start, end),
        ...generateAvailableSlots(start, end),
        ...events,
      ])
    }
  } catch (error) {
    console.error('Error fetching lessons:', error)
  }
}

// Generate background events for break periods
const generateBreakPeriods = (start: Date, end: Date) => {
  const breakEvents = []
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
      const dayBreaks = generateBreaksForDay(current)
      breakEvents.push(...dayBreaks)
    }
    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }

  return breakEvents
}

// Generate break periods for a specific day
const generateBreaksForDay = (date: Date) => {
  const breaks: Array<{
    start: string
    end: string
    display: string
    color: string
    className: string
    title: string
    extendedProps: { type: string }
  }> = []
  const breakTimes = [
    { start: '10:00', end: '10:15' },
    { start: '12:15', end: '12:30' },
    { start: '14:30', end: '14:45' },
    { start: '16:45', end: '17:00' },
    { start: '19:00', end: '19:15' },
    { start: '21:15', end: '21:30' },
  ]

  breakTimes.forEach((breakTime) => {
    const breakStart = new Date(date)
    const [startHour = 0, startMinute = 0] = breakTime.start.split(':').map(Number)
    breakStart.setHours(startHour, startMinute, 0, 0)

    const breakEnd = new Date(date)
    const [endHour = 0, endMinute = 0] = breakTime.end.split(':').map(Number)
    breakEnd.setHours(endHour, endMinute, 0, 0)

    breaks.push({
      start: breakStart.toISOString(),
      end: breakEnd.toISOString(),
      display: 'background',
      color: '#ffebee',
      className: 'break-period',
      title: 'Break Time',
      extendedProps: { type: 'break' },
    })
  })

  return breaks
}

// Generate available lesson slots
const generateAvailableSlots = (start: Date, end: Date) => {
  const slotEvents = []
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
      const daySlots = generateSlotsForDay(current)
      slotEvents.push(...daySlots)
    }
    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }

  return slotEvents
}

// Generate slots for a specific day
const generateSlotsForDay = (date: Date) => {
  const dayStart = new Date(date)
  dayStart.setHours(8, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(24, 0, 0, 0)

  return [
    {
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
      display: 'background',
      color: 'rgba(56, 170, 217, 0.03)',
      className: 'available-slot',
      title: 'Available for Lessons',
      extendedProps: { type: 'available' },
    },
  ]
}

// Calculate end time as 1 hour after start time
const calculateEndTime = (startTimeStr: string) => {
  const startTime = new Date(startTimeStr)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
  return formatForDateTimeInput(endTime.toISOString())
}

// Get calendar API instance
const getCalendarApi = () => {
  if (calendarRef.value) {
    return calendarRef.value.getApi()
  }
  return null
}

// Handle event drag and drop
const handleTeacherEventDrop = (dropInfo: unknown) => {
  const info = dropInfo as {
    event: {
      id: string
      title: string
      startStr: string
      endStr: string
      extendedProps: {
        isOwned: boolean
        teacherId: number
        studentId: number
        subjectId: number
        isRecurring: boolean
        status: string
        teacherName: string
        studentName: string
        subjectName: string
      }
    }
    oldEvent: {
      startStr: string
      endStr: string
    }
    revert: () => void
  }

  console.log('Event moved:', info)

  const event = info.event

  // Check if user owns this lesson
  if (!event.extendedProps.isOwned) {
    alert('You can only edit your own lessons')
    info.revert()
    return
  }

  // Use local times from FullCalendar
  const newStart = formatForDateTimeInput(event.startStr)
  const newEnd = formatForDateTimeInput(event.endStr)

  movedEventInfo.value = {
    id: event.id,
    title: event.title,
    oldStart: formatForDateTimeInput(info.oldEvent.startStr),
    oldEnd: formatForDateTimeInput(info.oldEvent.endStr),
    newStart: newStart,
    newEnd: newEnd,
    isRecurring: event.extendedProps.isRecurring,
    teacherId: event.extendedProps.teacherId,
    studentId: event.extendedProps.studentId,
    subjectId: event.extendedProps.subjectId,
    status: event.extendedProps.status,
  }

  recurringOption.value = 'this'
  showMoveConfirmModal.value = true

  // Revert the visual change until user confirms
  info.revert()
}

// Confirm teacher event move
const confirmTeacherEventMove = async (applyToAll: boolean = false) => {
  if (!movedEventInfo.value) return

  isUpdatingLesson.value = true

  try {
    // Convert local times to UTC for backend
    const startTimeFormatted = formatForBackend(movedEventInfo.value.newStart)
    const endTimeFormatted = formatForBackend(movedEventInfo.value.newEnd)

    const lessonData = {
      teacher_id: movedEventInfo.value.teacherId,
      student_id: movedEventInfo.value.studentId,
      subject_id: movedEventInfo.value.subjectId,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      is_recurring: movedEventInfo.value.isRecurring,
      status: movedEventInfo.value.status,
    }

    console.log(
      'Moving lesson (UTC):',
      movedEventInfo.value.id,
      lessonData,
      'Apply to all:',
      applyToAll,
    )
    console.log('Local times were:', movedEventInfo.value.newStart, movedEventInfo.value.newEnd)

    const response = await fetch(
      `http://localhost:8080/api/lessons/${movedEventInfo.value.id}?apply_to_all=${applyToAll}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lessonData),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to move lesson')
    }

    const result = await response.json()
    console.log('Lesson moved successfully:', result)

    // Refresh calendar to show the updated event
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchTeacherCalendarLessons(view.activeStart, view.activeEnd)
    }
  } catch (error) {
    console.error('Error moving lesson:', error)
    alert(`Failed to move lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isUpdatingLesson.value = false
    showMoveConfirmModal.value = false
    movedEventInfo.value = null
  }
}

// Cancel event move
const cancelTeacherEventMove = () => {
  showMoveConfirmModal.value = false
  movedEventInfo.value = null
}

// Handle event drag and drop (old function - remove updateLessonFromDrag as we're using modal now)

// Handle calendar date selection for new lesson
const handleDateSelect = (info: { startStr: string; endStr: string }) => {
  // info.startStr and info.endStr are already ISO strings from FullCalendar
  // Format them for the datetime-local input
  const startFormatted = formatForDateTimeInput(info.startStr)
  const endFormatted = formatForDateTimeInput(info.endStr)

  selectedTimeSlot.value = {
    start: startFormatted,
    end: endFormatted,
  }

  newLesson.value.start = startFormatted
  newLesson.value.end = endFormatted
  newLesson.value.teacher = String(getCurrentUserId())
  showLessonModal.value = true
}

// Handle event click to edit or view lesson
const handleTeacherEventClick = (clickInfo: { event: unknown }) => {
  const event = clickInfo.event as {
    id: string
    title: string
    startStr: string
    endStr: string
    extendedProps: {
      isOwned: boolean
      teacherId: number
      studentId: number
      subjectId: number
      isRecurring: boolean
      status: string
      teacherName: string
      studentName: string
      subjectName: string
    }
  }

  // Only allow editing own lessons
  if (event.extendedProps.isOwned) {
    selectedLesson.value = {
      id: event.id,
      title: event.title,
      start: formatForDateTimeInput(event.startStr),
      end: formatForDateTimeInput(event.endStr),
      teacherId: event.extendedProps.teacherId,
      studentId: event.extendedProps.studentId,
      subjectId: event.extendedProps.subjectId,
      isRecurring: event.extendedProps.isRecurring,
      status: event.extendedProps.status,
      teacherName: event.extendedProps.teacherName,
      studentName: event.extendedProps.studentName,
      subjectName: event.extendedProps.subjectName,
      isOwned: event.extendedProps.isOwned,
    }
    showEditModal.value = true
  } else {
    // Show view-only info for other teachers' lessons
    alert(
      `${event.extendedProps.teacherName}'s lesson: ${event.extendedProps.subjectName}\nStudent: ${event.extendedProps.studentName}`,
    )
  }
}

// Format date for datetime-local input (show local time to user)
const formatForDateTimeInput = (dateStr: string) => {
  // Input from backend is UTC (e.g., "2024-01-16T10:00:00")
  // We need to show it as local time in the datetime-local input
  const date = new Date(dateStr)

  // Get the local time components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Format date for backend (convert local to UTC)
const formatForBackend = (dateTimeStr: string) => {
  // Input is from datetime-local input field (format: "YYYY-MM-DDTHH:mm")
  // This represents the user's local time, convert to UTC for backend
  const date = new Date(dateTimeStr)
  return date.toISOString().slice(0, 19) // Format: "2024-01-16T10:00:00" in UTC
}

// Format date and time for display (matching admin format)
const formatDateTime = (dateTimeStr: string) => {
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

// Create new lesson
const createLesson = async () => {
  if (
    !newLesson.value.student ||
    !newLesson.value.subject ||
    !newLesson.value.start ||
    !newLesson.value.end
  ) {
    lessonMessage.value = 'Please fill in all fields'
    return
  }

  isCreatingLesson.value = true
  lessonMessage.value = ''

  try {
    const lessonData = {
      teacher_id: parseInt(newLesson.value.teacher),
      student_id: parseInt(newLesson.value.student),
      subject_id: parseInt(newLesson.value.subject),
      start_time: formatForBackend(newLesson.value.start),
      end_time: formatForBackend(newLesson.value.end),
      is_recurring: newLesson.value.isRecurring,
    }
    console.log('Creating lesson with data:', lessonData)

    const response = await fetch('http://localhost:8080/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create lesson')
    }

    lessonMessage.value = 'Lesson created successfully!'
    resetLessonForm()
    showLessonModal.value = false

    // Refresh calendar using actual view dates
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchTeacherCalendarLessons(view.activeStart, view.activeEnd)
    }

    setTimeout(() => {
      lessonMessage.value = ''
    }, 2000)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating lesson:', error)
    lessonMessage.value = `Error: ${errorMsg}`
  } finally {
    isCreatingLesson.value = false
  }
}

// Update existing lesson
const updateLesson = async () => {
  if (
    !selectedLesson.value ||
    !selectedLesson.value.start ||
    !selectedLesson.value.end ||
    !selectedLesson.value.studentId ||
    !selectedLesson.value.subjectId
  ) {
    editMessage.value = 'Please fill in all fields'
    return
  }

  // Check ownership
  if (selectedLesson.value.teacherId !== getCurrentUserId()) {
    editMessage.value = 'You can only edit your own lessons'
    return
  }

  isUpdatingLesson.value = true
  editMessage.value = ''

  try {
    const lessonData = {
      teacher_id: selectedLesson.value.teacherId,
      student_id: selectedLesson.value.studentId,
      subject_id: selectedLesson.value.subjectId,
      start_time: formatForBackend(selectedLesson.value.start),
      end_time: formatForBackend(selectedLesson.value.end),
      is_recurring: selectedLesson.value.isRecurring,
      status: selectedLesson.value.status,
    }
    console.log('Updating lesson with data:', lessonData)

    const response = await fetch(`http://localhost:8080/api/lessons/${selectedLesson.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update lesson')
    }

    editMessage.value = 'Lesson updated successfully!'
    showEditModal.value = false

    // Refresh calendar using actual view dates
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchTeacherCalendarLessons(view.activeStart, view.activeEnd)
    }

    setTimeout(() => {
      editMessage.value = ''
    }, 2000)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating lesson:', error)
    editMessage.value = `Error: ${errorMsg}`
  } finally {
    isUpdatingLesson.value = false
  }
}

// Delete lesson
const deleteLesson = async () => {
  if (!selectedLesson.value || !selectedLesson.value.id) return

  // Check ownership
  if (selectedLesson.value.teacherId !== getCurrentUserId()) {
    editMessage.value = 'You can only delete your own lessons'
    return
  }

  if (!confirm('Are you sure you want to delete this lesson?')) return

  isDeletingLesson.value = true
  editMessage.value = ''

  try {
    const response = await fetch(`http://localhost:8080/api/lessons/${selectedLesson.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to delete lesson')
    }

    editMessage.value = 'Lesson deleted successfully!'
    showEditModal.value = false

    // Refresh calendar using actual view dates
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchTeacherCalendarLessons(view.activeStart, view.activeEnd)
    }

    setTimeout(() => {
      editMessage.value = ''
    }, 2000)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting lesson:', error)
    editMessage.value = `Error: ${errorMsg}`
  } finally {
    isDeletingLesson.value = false
  }
}

// Reset lesson form
const resetLessonForm = () => {
  newLesson.value = {
    teacher: String(getCurrentUserId()) || '',
    student: '',
    subject: '',
    start: '',
    end: '',
    isRecurring: false,
  }
  lessonMessage.value = ''
}

// Close modals
const closeModal = () => {
  showLessonModal.value = false
  resetLessonForm()
}

const closeEditModal = () => {
  showEditModal.value = false
  editMessage.value = ''
}

// Calendar options configuration
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridWeek',
  },
  contentHeight: 600,
  events: [],
  slotMinTime: '08:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:15:00',
  slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
    meridiem: false,
  },
  slotEventOverlap: false,
  eventMaxStack: 1,
  firstDay: 1,
  allDaySlot: false,
  nowIndicator: true,
  editable: true,
  selectable: true,
  selectMirror: true,
  weekends: true,
  dayHeaderFormat: {
    weekday: 'short' as const,
    day: 'numeric' as const,
  },
  select: handleDateSelect,
  eventClick: handleTeacherEventClick,
  eventDrop: handleTeacherEventDrop,
  datesSet: (dateInfo: unknown) => {
    const info = dateInfo as { start: Date; end: Date }
    fetchTeacherCalendarLessons(info.start, info.end)
  },
  timeZone: 'local',
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    startTime: '08:00',
    endTime: '24:00',
  },
  eventContent: (arg: any) => {
    // Split title by newline and create HTML with line breaks
    const lines = arg.event.title.split('\n')
    const titleHtml = lines.join('<br>')
    return { html: titleHtml }
  },
})

// Watch for start time changes and auto-set end time to 1 hour later
watch(
  () => newLesson.value.start,
  (newStartTime) => {
    if (newStartTime) {
      newLesson.value.end = calculateEndTime(newStartTime)
    }
  },
)

onMounted(() => {
  fetchConnectedUsers()
  fetchDropdownData()
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- Main Dashboard View -->
    <div v-if="currentView === 'main'">
      <h1>Teacher Dashboard</h1>
      <div class="teacher-grid">
        <button class="teacher-card" @click="showStudents">
          <h3>My Students</h3>
          <p>View your assigned students</p>
        </button>
        <button class="teacher-card" @click="showCalendar">
          <h3>Lesson Calendar</h3>
          <p>Schedule and manage lessons</p>
        </button>
        <button class="teacher-card" @click="showSubjects">
          <h3>Teaching Subjects</h3>
          <p>Manage your subjects</p>
        </button>
        <button class="teacher-card" @click="showConnections">
          <h3>Connections</h3>
          <p>Connect with students</p>
        </button>
        <button class="teacher-card" @click="showProfile">
          <h3>My Profile</h3>
          <p>Manage your account information</p>
        </button>
      </div>
    </div>

    <!-- Students View -->
    <div v-else-if="currentView === 'students'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Students</h1>
      </div>
      <div class="section-content">
        <!-- Students content remains the same -->
        <div v-if="isLoading" class="loading">
          <p>Loading students...</p>
        </div>

        <div v-else-if="connectedStudents.length === 0" class="no-students">
          <div class="empty-state">
            <h3>No Students Connected Yet</h3>
            <p>
              You haven't connected with any students yet. Use the Connections section to connect
              with your students.
            </p>
            <button @click="showConnections" class="btn-primary">Go to Connections</button>
          </div>
        </div>

        <div v-else class="students-list">
          <h2>Connected Students ({{ connectedStudents.length }})</h2>
          <div class="students-grid">
            <div v-for="student in connectedStudents" :key="student.id" class="student-card">
              <div class="student-avatar">
                {{ student.first_name.charAt(0) }}{{ student.last_name.charAt(0) }}
              </div>
              <div class="student-info">
                <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                <p class="student-email">{{ student.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-else-if="currentView === 'calendar'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>Lesson Calendar</h1>
      </div>
      <div class="section-content">
        <!-- Lesson Creation Modal -->
        <div v-if="showLessonModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>Create New Lesson</h2>
              <button class="close-btn" @click="closeModal">×</button>
            </div>

            <div class="modal-body">
              <!-- Selected Time Display -->
              <div v-if="selectedTimeSlot.start" class="time-selection">
                <div class="form-group time-input-group">
                  <label for="start-time">Start Time:</label>
                  <input
                    id="start-time"
                    v-model="newLesson.start"
                    type="datetime-local"
                    class="form-input time-input"
                    required
                  />
                </div>
                <div class="form-group time-input-group">
                  <label for="end-time">End Time:</label>
                  <input
                    id="end-time"
                    v-model="newLesson.end"
                    type="datetime-local"
                    class="form-input time-input"
                    required
                  />
                </div>
              </div>

              <!-- Lesson Form -->
              <form @submit.prevent="createLesson" class="lesson-form">
                <div class="form-group">
                  <label for="student">Select Student:</label>
                  <select id="student" v-model="newLesson.student" class="form-select" required>
                    <option value="">Choose a connected student...</option>
                    <option
                      v-for="student in connectedStudents"
                      :key="student.id"
                      :value="String(student.id)"
                    >
                      {{ student.first_name }} {{ student.last_name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="subject">Select Subject:</label>
                  <select id="subject" v-model="newLesson.subject" class="form-select" required>
                    <option value="">Choose a subject...</option>
                    <option
                      v-for="subject in subjects"
                      :key="subject.id"
                      :value="String(subject.id)"
                    >
                      {{ subject.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input v-model="newLesson.isRecurring" type="checkbox" class="checkbox-input" />
                    <span class="checkmark"></span>
                    Recurring Lesson (weekly at same time)
                  </label>
                </div>

                <div
                  v-if="lessonMessage"
                  class="message"
                  :class="{ error: lessonMessage.includes('Error') }"
                >
                  {{ lessonMessage }}
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
                  <button type="submit" class="btn-create" :disabled="isCreatingLesson">
                    {{ isCreatingLesson ? 'Creating...' : 'Create Lesson' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="calendar-container">
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
        </div>

        <!-- Edit Lesson Modal -->
        <div v-if="showEditModal && selectedLesson" class="modal-overlay" @click="closeEditModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ selectedLesson.isOwned ? 'Edit Lesson' : 'Lesson Details (View Only)' }}</h2>
              <button class="close-btn" @click="closeEditModal">×</button>
            </div>

            <div class="modal-body">
              <form @submit.prevent="selectedLesson.isOwned && updateLesson()" class="lesson-form">
                <div class="form-group">
                  <label for="edit-subject">Subject:</label>
                  <input
                    id="edit-subject"
                    v-model="selectedLesson.subjectName"
                    type="text"
                    class="form-input"
                    :disabled="!selectedLesson.isOwned"
                  />
                </div>

                <div class="form-group">
                  <label for="edit-student">Student:</label>
                  <select
                    id="edit-student"
                    v-model="selectedLesson.studentId"
                    class="form-select"
                    :disabled="!selectedLesson.isOwned"
                  >
                    <option :value="selectedLesson.studentId">
                      {{ selectedLesson.studentName }}
                    </option>
                    <option
                      v-for="student in connectedStudents"
                      :key="student.id"
                      :value="student.id"
                    >
                      {{ student.first_name }} {{ student.last_name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="edit-teacher">Teacher:</label>
                  <input
                    id="edit-teacher"
                    v-model="selectedLesson.teacherName"
                    type="text"
                    class="form-input"
                    disabled
                  />
                </div>

                <div v-if="selectedLesson.isOwned" class="form-group time-input-group">
                  <label for="edit-start">Start Time:</label>
                  <input
                    id="edit-start"
                    v-model="selectedLesson.start"
                    type="datetime-local"
                    class="form-input time-input"
                  />
                </div>

                <div v-if="selectedLesson.isOwned" class="form-group time-input-group">
                  <label for="edit-end">End Time:</label>
                  <input
                    id="edit-end"
                    v-model="selectedLesson.end"
                    type="datetime-local"
                    class="form-input time-input"
                  />
                </div>

                <div v-if="!selectedLesson.isOwned" class="form-group">
                  <label>Time:</label>
                  <p class="form-text">
                    {{ formatForDateTimeInput(selectedLesson.start) }} to
                    {{ formatForDateTimeInput(selectedLesson.end) }}
                  </p>
                </div>

                <div
                  v-if="editMessage"
                  class="message"
                  :class="{ error: editMessage.includes('Error') }"
                >
                  {{ editMessage }}
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-cancel" @click="closeEditModal">Close</button>
                  <button
                    v-if="selectedLesson.isOwned"
                    type="button"
                    class="btn-delete"
                    @click="deleteLesson"
                    :disabled="isDeletingLesson"
                  >
                    {{ isDeletingLesson ? 'Deleting...' : 'Delete Lesson' }}
                  </button>
                  <button
                    v-if="selectedLesson.isOwned"
                    type="submit"
                    class="btn-create"
                    :disabled="isUpdatingLesson"
                  >
                    {{ isUpdatingLesson ? 'Updating...' : 'Update Lesson' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Move Confirmation Modal -->
        <div v-if="showMoveConfirmModal" class="modal-overlay" @click="cancelTeacherEventMove">
          <div class="modal-content move-confirm-modal" @click.stop>
            <div class="modal-header">
              <h2>Move Lesson</h2>
              <button class="close-btn" @click="cancelTeacherEventMove">×</button>
            </div>

            <div class="modal-body">
              <div class="move-info" v-if="movedEventInfo">
                <div class="info-section">
                  <h3>{{ movedEventInfo.title }}</h3>
                  <div class="time-change">
                    <div class="time-row">
                      <span class="time-label">From:</span>
                      <span class="time-value">{{ formatDateTime(movedEventInfo.oldStart) }}</span>
                    </div>
                    <div class="time-row">
                      <span class="time-label">To:</span>
                      <span class="time-value new-time">{{
                        formatDateTime(movedEventInfo.newStart)
                      }}</span>
                    </div>
                  </div>
                </div>

                <div class="recurring-options" v-if="movedEventInfo.isRecurring">
                  <h4>This is a recurring lesson</h4>
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" v-model="recurringOption" value="this" />
                      <span class="radio-checkmark"></span>
                      Change only this occurrence
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="recurringOption" value="all" />
                      <span class="radio-checkmark"></span>
                      Change all future occurrences
                    </label>
                  </div>
                </div>

                <div class="move-actions">
                  <button type="button" class="btn-cancel" @click="cancelTeacherEventMove">
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn-save"
                    @click="confirmTeacherEventMove(recurringOption === 'all')"
                  >
                    {{ movedEventInfo.isRecurring ? 'Save Changes' : 'Move Lesson' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-color" style="background: #38aad9"></div>
            <span>Your Lessons</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #6c757d"></div>
            <span>Student's Other Lessons</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Subjects View -->
    <div v-else-if="currentView === 'subjects'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>Teaching Subjects</h1>
      </div>
      <div class="section-content">
        <p>Subject management content coming soon...</p>
      </div>
    </div>

    <!-- Connections View -->
    <div v-else-if="currentView === 'connections'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Connections</h1>
      </div>
      <div class="section-content">
        <connections-section />
      </div>
    </div>

    <!-- Profile View -->
    <div v-else-if="currentView === 'profile'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Profile</h1>
      </div>
      <div class="section-content">
        <profile-section />
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-dashboard {
  padding: 2rem;
}

.teacher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.teacher-card {
  background: #38aad9;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.teacher-card:hover {
  background: #2a8fc7;
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.teacher-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.teacher-card p {
  margin: 0;
  opacity: 0.9;
}

/* Section Views and other styles remain the same as before */
.section-view {
  background: #fff9d8;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.back-btn {
  background: #42993c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.back-btn:hover {
  background: #357c30;
  transform: translateX(-3px);
}

.section-header h1 {
  margin: 0;
  color: #6c0f5f;
}

.section-content {
  color: #333;
  line-height: 1.6;
}

/* Students List Styles */
.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-students {
  text-align: center;
  padding: 2rem;
}

.empty-state {
  background: white;
  padding: 3rem 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  color: #6c0f5f;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.btn-primary {
  background: #38aad9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #2a8fc7;
  transform: translateY(-2px);
}

.students-list h2 {
  color: #6c0f5f;
  margin-bottom: 1.5rem;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.student-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid #38aad9;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #38aad9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  color: #6c0f5f;
}

.student-email {
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.connection-date {
  color: #6c757d;
  margin: 0;
  font-size: 0.8rem;
}

/* Calendar Styles */
.calendar-container {
  height: 600px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.calendar-legend {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  background: #38aad9;
  color: white;
  border-radius: 15px 15px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
}

.time-selection {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.time-input-group {
  flex: 1;
}

.time-input {
  min-width: 0;
  font-size: 0.9rem;
  padding: 0.6rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #38aad9;
}

.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #38aad9;
}

.form-select {
  width: 100%;
  min-height: 46px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  padding: 0.75rem;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #38aad9;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

.checkbox-input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-input:checked + .checkmark {
  background: #38aad9;
  border-color: #38aad9;
}

.checkbox-input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.message.error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.btn-create {
  background: #42993c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-create:hover:not(:disabled) {
  background: #357c30;
  transform: translateY(-2px);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Move modal specific styles */
.move-info {
  text-align: center;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: #38aad9;
  font-size: 1.2rem;
}

.time-change {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  border-left: 4px solid #38aad9;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.time-row:last-child {
  margin-bottom: 0;
}

.time-label {
  font-weight: bold;
  color: #6c757d;
}

.time-value {
  color: #333;
}

.new-time {
  color: #42993c;
  font-weight: bold;
}

.recurring-options {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.recurring-options h4 {
  margin: 0 0 1rem 0;
  color: #856404;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

.radio-label input[type='radio'] {
  display: none;
}

.radio-checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #6c757d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.radio-label input[type='radio']:checked + .radio-checkmark {
  border-color: #42993c;
  background: #42993c;
}

.radio-label input[type='radio']:checked + .radio-checkmark::after {
  content: '';
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.move-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.move-actions .btn-cancel,
.move-actions .btn-save {
  min-width: 120px;
}
</style>

<style>
/* FullCalendar custom styling */
:deep(.fc) {
  height: 100%;
}

:deep(.fc-header-toolbar) {
  padding: 1rem;
  margin-bottom: 0 !important;
}

:deep(.fc-toolbar-title) {
  color: #38aad9;
  font-weight: bold;
  font-size: 1.5rem;
}

:deep(.fc-button) {
  background: #38aad9 !important;
  border: none !important;
}

:deep(.fc-button:hover) {
  background: #2a8fc7 !important;
}

:deep(.fc-button-active) {
  background: #2a8fc7 !important;
}

:deep(.fc-event) {
  background: #38aad9;
  border: none;
  border-radius: 4px;
  border-left: 4px solid #2a8fc7;
  padding: 2px 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

:deep(.fc-event:hover) {
  background: #2a8fc7;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.fc-event-title) {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.fc-highlight) {
  background: rgba(56, 170, 217, 0.2) !important;
}

:deep(.fc-non-business) {
  background-color: rgba(0, 0, 0, 0.03) !important;
}
</style>
