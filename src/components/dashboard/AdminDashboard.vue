<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import TomSelect from 'tom-select'

defineOptions({
  name: 'AdminDashboard',
})

const currentView = ref<'main' | 'users' | 'lessons' | 'settings'>('main')
const showLessonModal = ref(false)
const showEditModal = ref(false)
const showMoveConfirmModal = ref(false)
const selectedTimeSlot = ref<any>(null)
const selectedLesson = ref<any>(null)
const movedEventInfo = ref<any>(null)
const calendarRef = ref<any>(null)

const newLesson = ref({
  teacher: '',
  student: '',
  subject: '',
  start: '',
  end: '',
  isRecurring: false,
})

// Convert UTC time from backend to local time for datetime inputs
const formatForDateTimeInput = (dateStr: string) => {
  const date = new Date(dateStr)

  // Get local time components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Convert local time to UTC for backend
const formatForBackend = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr)
  return date.toISOString().slice(0, 19) // Format: "2024-01-16T10:00:00"
}
const calendarEvents = ref<any[]>([])

// Function to fetch lessons from backend
const fetchLessons = async (start: Date, end: Date) => {
  try {
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    console.log(`Fetching lessons from ${startStr} to ${endStr}`)

    const response = await fetch(
      `http://localhost:8080/api/lessons?start_date=${startStr}&end_date=${endStr}`,
      {
        credentials: 'include',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch lessons')
    }

    const data = await response.json()
    console.log('Fetched lessons:', data.lessons)

    const events = data.lessons.map((lesson: any) => ({
      id: lesson.id.toString(),
      title: `${lesson.subject_name} - ${lesson.teacher_name}`,
      start: lesson.start_time,
      end: lesson.end_time,
      extendedProps: {
        teacherId: lesson.teacher_id,
        studentId: lesson.student_id,
        subjectId: lesson.subject_id,
        studentName: lesson.student_name,
        teacherName: lesson.teacher_name,
        subjectName: lesson.subject_name,
        status: lesson.status,
        isRecurring: lesson.is_recurring,
      },
    }))

    calendarEvents.value = events
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      // Remove existing lesson events and add new ones
      calendarApi.removeAllEvents()
      calendarApi.addEventSource([
        ...generateBreakPeriods(start, end),
        ...generateAvailableSlots(start, end),
        ...events,
      ])
    }
  } catch (error) {
    console.error('Error fetching lessons:', error)
    calendarEvents.value = []
  }
}

// Update the calculateEndTime function
const calculateEndTime = (startTimeStr: string) => {
  const startTime = new Date(startTimeStr)
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
  return formatForDateTimeInput(endTime.toISOString())
}

// Real data from backend
const teachers = ref<any[]>([])
const students = ref<any[]>([])
const subjects = ref<any[]>([])

// TomSelect instances
let teacherSelect: any = null
let studentSelect: any = null
let subjectSelect: any = null

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridWeek',
  },
  // REMOVE this line: events: calendarEvents,
  slotMinTime: '08:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:15:00',
  slotLabelInterval: '00:30:00',
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  firstDay: 1,
  allDaySlot: false,
  nowIndicator: true,
  editable: true,
  selectable: true,
  selectMirror: true,
  weekends: true,
  dayHeaderFormat: { weekday: 'short', day: 'numeric' },
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  datesSet: (dateInfo: any) => {
    console.log('Date range changed:', dateInfo)
    fetchLessons(dateInfo.start, dateInfo.end)
  },
  timeZone: 'local',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },

  // Add business hours to highlight available lesson periods
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    startTime: '08:00',
    endTime: '24:00',
  },

  // Add background events for break periods - FIXED VERSION
  eventSources: [
    {
      events: function (fetchInfo: any, successCallback: any, failureCallback: any) {
        const backgroundEvents = [
          ...generateBreakPeriods(fetchInfo.start, fetchInfo.end),
          ...generateAvailableSlots(fetchInfo.start, fetchInfo.end),
        ]
        successCallback(backgroundEvents)
      },
      color: 'transparent',
      textColor: 'black',
    },
    // This will automatically include calendarEvents through the datesSet handler
  ],
})

// Generate background events for break periods
const generateBreakPeriods = (start: Date, end: Date) => {
  const breakEvents = []
  const current = new Date(start)

  // Loop through each day in the visible range
  while (current <= end) {
    const dayOfWeek = current.getDay()

    // Only show breaks on weekdays (1-5 = Monday-Friday) and Saturday (6)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const dayBreaks = generateBreaksForDay(current)
      breakEvents.push(...dayBreaks)
    }

    // Move to next day
    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }

  return breakEvents
}

// Generate break periods for a specific day
const generateBreaksForDay = (date: Date) => {
  const breaks = []
  const dayStart = new Date(date)
  dayStart.setHours(8, 0, 0, 0) // Start at 8:00

  // Lesson pattern: 2 lessons -> 15min break -> 2 lessons -> 15min break -> repeat
  let currentTime = new Date(dayStart)

  while (currentTime.getHours() < 24) {
    // Add two 1-hour lesson blocks
    const lessonBlock1End = new Date(currentTime)
    lessonBlock1End.setHours(currentTime.getHours() + 2) // 2 hours for two lessons

    // Add 15-minute break after two lessons
    const breakStart = new Date(lessonBlock1End)
    const breakEnd = new Date(breakStart)
    breakEnd.setMinutes(breakStart.getMinutes() + 15)

    // Only add break if it doesn't go past midnight
    if (breakEnd.getHours() < 24) {
      breaks.push({
        start: breakStart.toISOString(),
        end: breakEnd.toISOString(),
        display: 'background',
        color: '#ffebee', // Light red background for breaks
        className: 'break-period',
        title: 'Break Time',
        extendedProps: {
          type: 'break',
        },
      })
    }

    // Move to next lesson block (after break)
    currentTime = new Date(breakEnd)

    // Stop if we've reached the end of the day
    if (currentTime.getHours() >= 24) break
  }

  return breaks
}

// Add this function to generate available lesson slots
const generateAvailableSlots = (start: Date, end: Date) => {
  const slotEvents = []
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()

    // Only show available slots on weekdays (1-5 = Monday-Friday) and Saturday (6)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      const daySlots = generateSlotsForDay(current)
      slotEvents.push(...daySlots)
    }

    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }

  return slotEvents
}

const generateSlotsForDay = (date: Date) => {
  const slots = []
  const dayStart = new Date(date)
  dayStart.setHours(8, 0, 0, 0)

  let currentTime = new Date(dayStart)

  while (currentTime.getHours() < 24) {
    // Check if this is a break period
    const isBreakPeriod = isBreakTime(currentTime)

    if (!isBreakPeriod) {
      // This is an available lesson slot
      const slotEnd = new Date(currentTime)
      slotEnd.setHours(currentTime.getHours() + 1) // 1-hour lesson slots

      // Only add slot if it doesn't go past midnight
      if (slotEnd.getHours() < 24) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          display: 'background',
          color: 'rgba(56, 170, 217, 0.1)', // Very light blue for available slots
          className: 'available-slot',
          title: 'Available for Lessons',
          extendedProps: {
            type: 'available',
          },
        })
      }
    }

    // Move to next 15-minute slot
    currentTime = new Date(currentTime)
    currentTime.setMinutes(currentTime.getMinutes() + 15)

    // Stop if we've reached the end of the day
    if (currentTime.getHours() >= 24) break
  }

  return slots
}

// Helper function to check if a time falls within break periods
const isBreakTime = (time: Date) => {
  const hour = time.getHours()
  const minute = time.getMinutes()

  // Break periods: 10:00-10:15, 12:15-12:30, 14:30-14:45, 16:45-17:00, etc.
  // Pattern: every 2 hours starting from 10:00, breaks are 15 minutes

  const totalMinutes = hour * 60 + minute
  const minutesFromStart = totalMinutes - 8 * 60 // Minutes from 8:00

  // Breaks occur every 120 minutes (2 hours of lessons) starting at 120 minutes from 8:00
  const breakCycle = Math.floor((minutesFromStart - 120) / 135) // 120min lessons + 15min break

  if (breakCycle >= 0) {
    const breakStart = 120 + breakCycle * 135
    const breakEnd = breakStart + 15

    return minutesFromStart >= breakStart && minutesFromStart < breakEnd
  }

  return false
}
// Get calendar API instance
const getCalendarApi = () => {
  if (calendarRef.value) {
    return calendarRef.value.getApi()
  }
  return null
}

// Refresh calendar events
const refreshCalendar = () => {
  const calendarApi = getCalendarApi()
  if (calendarApi) {
    fetchLessons(calendarApi.view.activeStart, calendarApi.view.activeEnd)
  }
}

// Fetch dropdown data from backend
const fetchDropdownData = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/dropdown-data', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dropdown data')
    }

    const data = await response.json()
    console.log('Dropdown data:', data)

    teachers.value = data.teachers || []
    students.value = data.students || []
    subjects.value = data.subjects || []
  } catch (error) {
    console.error('Error fetching dropdown data:', error)
    teachers.value = []
    students.value = []
    subjects.value = []
  }
}

// Initialize TomSelect instances when modal opens
const initializeTomSelect = () => {
  nextTick(() => {
    // Teacher select
    if (teacherSelect) {
      teacherSelect.destroy()
    }
    const teacherElement = document.getElementById('teacher') as HTMLSelectElement
    if (teacherElement) {
      teacherSelect = new TomSelect(teacherElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: teachers.value.map((teacher) => ({
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
        })),
        items: newLesson.value.teacher ? [newLesson.value.teacher] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          newLesson.value.teacher = value
        },
      })
    }

    // Student select
    if (studentSelect) {
      studentSelect.destroy()
    }
    const studentElement = document.getElementById('student') as HTMLSelectElement
    if (studentElement) {
      studentSelect = new TomSelect(studentElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: students.value.map((student) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
        })),
        items: newLesson.value.student ? [newLesson.value.student] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          newLesson.value.student = value
        },
      })
    }

    // Subject select
    if (subjectSelect) {
      subjectSelect.destroy()
    }
    const subjectElement = document.getElementById('subject') as HTMLSelectElement
    if (subjectElement) {
      subjectSelect = new TomSelect(subjectElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: subjects.value.map((subject) => ({
          id: subject.id,
          name: subject.name,
        })),
        items: newLesson.value.subject ? [newLesson.value.subject] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          newLesson.value.subject = value
        },
      })
    }
  })
}

// Initialize TomSelect for edit modal
const initializeEditTomSelect = () => {
  nextTick(() => {
    // Teacher select for edit modal
    if (teacherSelect) {
      teacherSelect.destroy()
    }
    const teacherElement = document.getElementById('edit-teacher') as HTMLSelectElement
    if (teacherElement) {
      teacherSelect = new TomSelect(teacherElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: teachers.value.map((teacher) => ({
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
        })),
        items: selectedLesson.value.teacherId ? [selectedLesson.value.teacherId.toString()] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          selectedLesson.value.teacherId = parseInt(value)
        },
      })
    }

    // Student select for edit modal
    if (studentSelect) {
      studentSelect.destroy()
    }
    const studentElement = document.getElementById('edit-student') as HTMLSelectElement
    if (studentElement) {
      studentSelect = new TomSelect(studentElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: students.value.map((student) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
        })),
        items: selectedLesson.value.studentId ? [selectedLesson.value.studentId.toString()] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          selectedLesson.value.studentId = parseInt(value)
        },
      })
    }

    // Subject select for edit modal
    if (subjectSelect) {
      subjectSelect.destroy()
    }
    const subjectElement = document.getElementById('edit-subject') as HTMLSelectElement
    if (subjectElement) {
      subjectSelect = new TomSelect(subjectElement, {
        valueField: 'id',
        labelField: 'name',
        searchField: ['name'],
        options: subjects.value.map((subject) => ({
          id: subject.id,
          name: subject.name,
        })),
        items: selectedLesson.value.subjectId ? [selectedLesson.value.subjectId.toString()] : [],
        maxItems: 1,
        create: false,
        hidePlaceholder: true,
        onChange: function (value: string) {
          selectedLesson.value.subjectId = parseInt(value)
        },
      })
    }
  })
}

// Navigation functions
const showUsers = () => (currentView.value = 'users')
const showLessons = () => {
  currentView.value = 'lessons'
  fetchDropdownData()
}
const showSettings = () => (currentView.value = 'settings')
const goBack = () => (currentView.value = 'main')

function handleDateSelect(selectInfo: any) {
  console.log('Selected date (local):', selectInfo.start, selectInfo.end)

  selectedTimeSlot.value = selectInfo

  // Use local times directly (FullCalendar already gives us local times)
  newLesson.value.start = formatForDateTimeInput(selectInfo.start)
  newLesson.value.end = formatForDateTimeInput(selectInfo.end)

  console.log('Formatted local times:', newLesson.value.start, newLesson.value.end)

  showLessonModal.value = true
  setTimeout(() => {
    initializeTomSelect()
  }, 100)

  selectInfo.view.calendar.unselect()
}

function handleEventClick(clickInfo: any) {
  console.log('Event clicked:', clickInfo)

  const event = clickInfo.event
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
  }

  showEditModal.value = true
  setTimeout(() => {
    initializeEditTomSelect()
  }, 100)
}

function handleEventDrop(dropInfo: any) {
  console.log('Event moved:', dropInfo)

  const event = dropInfo.event

  // Use local times from FullCalendar
  const newStart = formatForDateTimeInput(event.startStr)
  const newEnd = formatForDateTimeInput(event.endStr)

  movedEventInfo.value = {
    id: event.id,
    title: event.title,
    oldStart: event.extendedProps.oldStart || formatForDateTimeInput(dropInfo.oldEvent.startStr),
    oldEnd: event.extendedProps.oldEnd || formatForDateTimeInput(dropInfo.oldEvent.endStr),
    newStart: newStart,
    newEnd: newEnd,
    isRecurring: event.extendedProps.isRecurring,
    teacherId: event.extendedProps.teacherId,
    studentId: event.extendedProps.studentId,
    subjectId: event.extendedProps.subjectId,
    status: event.extendedProps.status,
  }

  // Store the original dates in extendedProps for later use
  event.setExtendedProp('oldStart', movedEventInfo.value.oldStart)
  event.setExtendedProp('oldEnd', movedEventInfo.value.oldEnd)

  showMoveConfirmModal.value = true

  // Revert the visual change until user confirms
  dropInfo.revert()
}

// Confirm event move
const confirmEventMove = async (applyToAll: boolean = false) => {
  if (!movedEventInfo.value) return

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

    const response = await fetch(`http://localhost:8080/api/lessons/${movedEventInfo.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to move lesson')
    }

    const result = await response.json()
    console.log('Lesson moved successfully:', result)

    // Refresh calendar to show the updated event
    refreshCalendar()
  } catch (error) {
    console.error('Error moving lesson:', error)
    alert(`Failed to move lesson: ${error.message}`)
  } finally {
    showMoveConfirmModal.value = false
    movedEventInfo.value = null
  }
}

// Cancel event move
const cancelEventMove = () => {
  showMoveConfirmModal.value = false
  movedEventInfo.value = null
  // Calendar will already be reverted visually due to dropInfo.revert()
}

// Lesson creation functions
const createLesson = async () => {
  // Validate required fields
  if (!newLesson.value.teacher || !newLesson.value.student || !newLesson.value.subject) {
    alert('Please fill in all required fields')
    return
  }

  try {
    // Convert local times to UTC for backend
    const startTimeFormatted = formatForBackend(newLesson.value.start)
    const endTimeFormatted = formatForBackend(newLesson.value.end)

    const lessonData = {
      teacher_id: parseInt(newLesson.value.teacher),
      student_id: parseInt(newLesson.value.student),
      subject_id: parseInt(newLesson.value.subject),
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      is_recurring: newLesson.value.isRecurring,
      recurrence_pattern: newLesson.value.isRecurring
        ? newLesson.value.recurrencePattern
        : undefined,
    }

    console.log('Sending lesson data (UTC):', lessonData)
    console.log('Local times were:', newLesson.value.start, newLesson.value.end)

    const response = await fetch('http://localhost:8080/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create lesson')
    }

    const result = await response.json()
    console.log('Lesson created successfully:', result)

    // Reset and close
    resetLessonForm()
    showLessonModal.value = false

    // Refresh calendar to show new lessons
    refreshCalendar()
  } catch (error) {
    console.error('Error creating lesson:', error)
    alert(`Failed to create lesson: ${error.message}`)
  }
}
// Update lesson function
const updateLesson = async () => {
  if (!selectedLesson.value) return

  try {
    // Convert local times to UTC for backend
    const startTimeFormatted = formatForBackend(selectedLesson.value.start)
    const endTimeFormatted = formatForBackend(selectedLesson.value.end)

    const lessonData = {
      teacher_id: selectedLesson.value.teacherId,
      student_id: selectedLesson.value.studentId,
      subject_id: selectedLesson.value.subjectId,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      is_recurring: selectedLesson.value.isRecurring,
      status: selectedLesson.value.status,
    }

    console.log('Updating lesson (UTC):', selectedLesson.value.id, lessonData)
    console.log('Local times were:', selectedLesson.value.start, selectedLesson.value.end)

    const response = await fetch(`http://localhost:8080/api/lessons/${selectedLesson.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update lesson')
    }

    const result = await response.json()
    console.log('Lesson updated successfully:', result)

    showEditModal.value = false
    selectedLesson.value = null

    // Refresh calendar to show updated lesson
    refreshCalendar()
  } catch (error) {
    console.error('Error updating lesson:', error)
    alert(`Failed to update lesson: ${error.message}`)
  }
}

// Delete lesson function
const deleteLesson = async () => {
  if (!selectedLesson.value) return

  if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
    return
  }

  try {
    const response = await fetch(`http://localhost:8080/api/lessons/${selectedLesson.value.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete lesson')
    }

    const result = await response.json()
    console.log('Lesson deleted successfully:', result)

    showEditModal.value = false
    selectedLesson.value = null

    // Refresh calendar to remove deleted lesson
    refreshCalendar()
  } catch (error) {
    console.error('Error deleting lesson:', error)
    alert(`Failed to delete lesson: ${error.message}`)
  }
}

// Update resetLessonForm to include isRecurring
const resetLessonForm = () => {
  newLesson.value = {
    teacher: '',
    student: '',
    subject: '',
    start: '',
    end: '',
    isRecurring: false,
  }

  if (teacherSelect) teacherSelect.clear()
  if (studentSelect) studentSelect.clear()
  if (subjectSelect) subjectSelect.clear()
}

const closeModal = () => {
  showLessonModal.value = false
  resetLessonForm()
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedLesson.value = null
}

// Format date for display
const formatSelectedTime = computed(() => {
  if (!selectedTimeSlot.value) return ''

  const start = new Date(selectedTimeSlot.value.startStr)
  const end = new Date(selectedTimeSlot.value.endStr)

  return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
})

// Format date time for display in move confirmation
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

const debugTimeHandling = () => {
  const testDate = new Date()
  console.log('Current local time:', testDate.toString())
  console.log('Current UTC time:', testDate.toISOString())
  console.log('Timezone offset (minutes):', testDate.getTimezoneOffset())
}

watch(
  () => newLesson.value.start,
  (newStartTime) => {
    if (newStartTime) {
      newLesson.value.end = calculateEndTime(newStartTime)
    }
  },
)

watch(
  () => selectedLesson.value?.start,
  (newStartTime) => {
    if (newStartTime && selectedLesson.value) {
      selectedLesson.value.end = calculateEndTime(newStartTime)
    }
  },
)

onMounted(() => {
  debugTimeHandling()
  fetchDropdownData()
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() - now.getDay() + 7) // Sunday

  fetchLessons(startOfWeek, endOfWeek)
})
// Add with your other refs
const recurringOption = ref<'this' | 'all'>('this')

// Reset recurring option when modal opens
watch(showMoveConfirmModal, (newVal) => {
  if (newVal && movedEventInfo.value?.isRecurring) {
    recurringOption.value = 'this'
  }
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- Lesson Creation Modal -->
    <div v-if="showLessonModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Create New Lesson</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Selected Time Display -->
          <div class="time-selection">
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
              <label for="teacher">Teacher:</label>
              <select id="teacher" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>

            <div class="form-group">
              <label for="student">Student:</label>
              <select id="student" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>

            <div class="form-group">
              <label for="subject">Subject:</label>
              <select id="subject" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="newLesson.isRecurring" type="checkbox" class="checkbox-input" />
                <span class="checkmark"></span>
                Recurring Lesson (weekly at same time)
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-create">Create Lesson</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Lesson Edit/Delete Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Lesson</h2>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Current Lesson Info -->
          <div class="lesson-info" v-if="selectedLesson">
            <div class="info-item">
              <strong>Current:</strong> {{ selectedLesson.teacherName }} teaching
              {{ selectedLesson.subjectName }} to {{ selectedLesson.studentName }}
            </div>
            <div class="info-item"><strong>Status:</strong> {{ selectedLesson.status }}</div>
          </div>

          <!-- Time Selection -->
          <div class="time-selection">
            <div class="form-group time-input-group">
              <label for="edit-start-time">Start Time:</label>
              <input
                id="edit-start-time"
                v-model="selectedLesson.start"
                type="datetime-local"
                class="form-input time-input"
                required
              />
            </div>
            <div class="form-group time-input-group">
              <label for="edit-end-time">End Time:</label>
              <input
                id="edit-end-time"
                v-model="selectedLesson.end"
                type="datetime-local"
                class="form-input time-input"
                required
              />
            </div>
          </div>

          <!-- Edit Form -->
          <form @submit.prevent="updateLesson" class="lesson-form">
            <div class="form-group">
              <label for="edit-teacher">Teacher:</label>
              <select id="edit-teacher" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>

            <div class="form-group">
              <label for="edit-student">Student:</label>
              <select id="edit-student" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>

            <div class="form-group">
              <label for="edit-subject">Subject:</label>
              <select id="edit-subject" class="form-select">
                <!-- No options here - TomSelect will populate them -->
              </select>
            </div>

            <div class="form-group">
              <label for="status">Status:</label>
              <select id="status" v-model="selectedLesson.status" class="form-select">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="selectedLesson.isRecurring"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkmark"></span>
                Recurring Lesson
              </label>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-delete" @click="deleteLesson">Delete Lesson</button>
              <div class="action-group">
                <button type="button" class="btn-cancel" @click="closeEditModal">Cancel</button>
                <button type="submit" class="btn-save">Save Changes</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Move Confirmation Modal -->
    <div v-if="showMoveConfirmModal" class="modal-overlay" @click="cancelEventMove">
      <div class="modal-content move-confirm-modal" @click.stop>
        <div class="modal-header">
          <h2>Move Lesson</h2>
          <button class="close-btn" @click="cancelEventMove">×</button>
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
              <button type="button" class="btn-cancel" @click="cancelEventMove">Cancel</button>
              <button
                type="button"
                class="btn-save"
                @click="confirmEventMove(recurringOption === 'all')"
              >
                {{ movedEventInfo.isRecurring ? 'Save Changes' : 'Move Lesson' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Cards View -->
    <div v-if="currentView === 'main'">
      <h1>Admin Panel</h1>
      <div class="admin-grid">
        <button class="admin-card" @click="showUsers">
          <h3>User Management</h3>
          <p>Manage all users in the system</p>
        </button>
        <button class="admin-card" @click="showLessons">
          <h3>All Lessons</h3>
          <p>View and manage all lessons</p>
        </button>
        <button class="admin-card" @click="showSettings">
          <h3>System Settings</h3>
          <p>Configure platform settings</p>
        </button>
      </div>
    </div>

    <!-- User Management View -->
    <div v-else-if="currentView === 'users'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Admin Panel</button>
        <h1>User Management</h1>
      </div>
      <div class="section-content">
        <p>User management content coming soon...</p>
      </div>
    </div>

    <!-- Lessons View -->
    <div v-else-if="currentView === 'lessons'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Admin Panel</button>
        <h1>All Lessons</h1>
      </div>
      <div class="section-content">
        <!-- FullCalendar Component -->
        <div class="calendar-container">
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
        </div>
      </div>
    </div>

    <!-- Settings View -->
    <div v-else-if="currentView === 'settings'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Admin Panel</button>
        <h1>System Settings</h1>
      </div>
      <div class="section-content">
        <p>System settings content coming soon...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  position: relative;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.admin-card {
  background: #6c0f5f;
  color: white;
  padding: 2rem;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.admin-card:hover {
  background: #8a1a7a;
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.admin-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.admin-card p {
  margin: 0;
  opacity: 0.9;
}

/* Section Views */
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

/* Calendar Styles */
.calendar-container {
  height: 70vh;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
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
  background: #6c0f5f;
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

.lesson-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #38aad9;
}

.info-item {
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.time-selection {
  display: flex;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.time-input-group {
  margin-bottom: 0;
  width: 200px;
}

.time-input {
  min-width: 0; /* Allow shrinking */
  font-size: 0.9rem; /* Slightly smaller font */
  padding: 0.6rem; /* Smaller padding */
}

.time-selection .form-group {
  flex: 1;
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
  color: #6c0f5f;
}

.form-select {
  width: 100%;
  min-height: 46px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.action-group {
  display: flex;
  gap: 1rem;
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

.btn-create,
.btn-save {
  background: #42993c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-create:hover,
.btn-save:hover {
  background: #357c30;
  transform: translateY(-2px);
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #c82333;
  transform: translateY(-2px);
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
  background: #42993c;
  border-color: #42993c;
}

.checkbox-input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

/* FullCalendar custom styling */
:deep(.fc) {
  height: 100%;
}

:deep(.fc-header-toolbar) {
  padding: 1rem;
  margin-bottom: 0 !important;
}

:deep(.fc-toolbar-title) {
  color: #6c0f5f;
  font-weight: bold;
}

:deep(.fc-button) {
  background: #38aad9 !important;
  border: none !important;
}

:deep(.fc-button:hover) {
  background: #2a8fc7 !important;
}

:deep(.fc-button-active) {
  background: #6c0f5f !important;
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

/* Selection styling */
:deep(.fc-highlight) {
  background: rgba(56, 170, 217, 0.2) !important;
}
.move-confirm-modal {
  max-width: 500px;
}

.move-info {
  text-align: center;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: #6c0f5f;
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
/* TomSelect custom styles */
.ts-wrapper {
  border: none !important;
  padding: 0 !important;
  background: none !important;
}

.ts-control {
  border: 2px solid #e0e0e0 !important;
  border-radius: 8px !important;
  padding: 0.75rem !important;
  background: white !important;
  box-shadow: none !important;
  min-height: 46px !important;
  display: flex !important;
  align-items: center !important;
}

.ts-control.focus {
  border-color: #38aad9 !important;
  box-shadow: 0 0 0 2px rgba(56, 170, 217, 0.1) !important;
}

.ts-control input {
  width: 100% !important;
  font-size: 1rem !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Fix TomSelect selected item display */
.ts-control > div.item {
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  display: block !important;
}

/* Hide placeholder when value is selected */
.ts-control input::placeholder {
  opacity: 1;
}

.ts-control.focus input::placeholder,
.ts-control.has-items input::placeholder {
  opacity: 0;
}

.ts-dropdown {
  border: 2px solid #e0e0e0 !important;
  border-radius: 8px !important;
  margin-top: 4px !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
}

.ts-dropdown .active {
  background-color: #38aad9 !important;
  color: white !important;
}

.ts-dropdown .selected {
  background-color: #6c0f5f !important;
  color: white !important;
}

.ts-dropdown .option {
  padding: 0.5rem 0.75rem !important;
}

.ts-dropdown .create {
  padding: 0.5rem 0.75rem !important;
}

/* Hide the original select element */
.tomselected.ts-hidden-accessible {
  position: absolute !important;
  opacity: 0 !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}
/* Break period styling */
:deep(.break-period) {
  background-color: #ffebee !important;
  border: 1px solid #ffcdd2 !important;
  opacity: 0.7;
}

/* Available slot styling */
:deep(.available-slot) {
  background-color: rgba(56, 170, 217, 0.05) !important;
  border-left: 2px solid rgba(56, 170, 217, 0.3) !important;
}

/* Make regular lessons stand out more */
:deep(.fc-event) {
  z-index: 10 !important; /* Ensure lessons appear above background events */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* Style for when hovering over available slots */
:deep(.available-slot:hover) {
  background-color: rgba(56, 170, 217, 0.1) !important;
}

/* Business hours styling */
:deep(.fc-non-business) {
  background-color: rgba(0, 0, 0, 0.03) !important;
}
</style>
