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
const searchQuery = ref('')
const sortField = ref<'first_name' | 'last_name' | 'email' | 'role' | 'phone'>('first_name')
const sortDirection = ref<'asc' | 'desc'>('asc')
// Add with your other refs
const expandedUserId = ref<number | null>(null)
const selectedUserForConnection = ref<any>(null)
const showConnectionModal = ref(false)
const connectionType = ref<'teacher-student' | 'parent-student'>('teacher-student')
const targetUserId = ref<number | null>(null)

// Teacher colors for calendar
const teacherColors = ref<Record<number, string>>({})

// Generate default color for a teacher using golden angle algorithm
const getDefaultTeacherColor = (teacherId: number): string => {
  const hue = (teacherId * 137.5) % 360
  const saturation = 70
  const lightness = 50

  // Convert HSL to RGB then to hex
  const c = ((100 - Math.abs(2 * lightness - 100)) / 100) * (saturation / 100)
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = lightness / 100 - c / 2

  let r = 0,
    g = 0,
    b = 0
  if (hue >= 0 && hue < 60) {
    r = c
    g = x
    b = 0
  } else if (hue >= 60 && hue < 120) {
    r = x
    g = c
    b = 0
  } else if (hue >= 120 && hue < 180) {
    r = 0
    g = c
    b = x
  } else if (hue >= 180 && hue < 240) {
    r = 0
    g = x
    b = c
  } else if (hue >= 240 && hue < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return '#' + toHex(r) + toHex(g) + toHex(b)
}

// Get teacher color (custom or default)
const getTeacherColor = (teacherId: number): string => {
  return teacherColors.value[teacherId] || getDefaultTeacherColor(teacherId)
}

// Teacher color picker modal state
const showColorPickerModal = ref(false)
const selectedTeacherForColor = ref<any>(null)
const colorPickerValue = ref('#38aad9')
const colorPickerMessage = ref('')
const isSavingColor = ref(false)

// Open color picker modal for a teacher
const openColorPickerModal = (teacher: any) => {
  selectedTeacherForColor.value = teacher
  colorPickerValue.value = teacherColors.value[teacher.id] || getDefaultTeacherColor(teacher.id)
  colorPickerMessage.value = ''
  showColorPickerModal.value = true
}

// Validate hex color format
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// Save teacher color
const saveTeacherColor = async () => {
  if (!selectedTeacherForColor.value) return

  if (!isValidHexColor(colorPickerValue.value)) {
    colorPickerMessage.value = 'Invalid color format. Please use #RRGGBB'
    return
  }

  isSavingColor.value = true
  colorPickerMessage.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/teacher-colors/${selectedTeacherForColor.value.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color_code: colorPickerValue.value }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save color')
    }

    // Update local color map
    teacherColors.value[selectedTeacherForColor.value.id] = colorPickerValue.value

    colorPickerMessage.value = 'Color saved successfully!'

    // Refresh calendar
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchLessons(view.activeStart, view.activeEnd)
    }

    setTimeout(() => {
      showColorPickerModal.value = false
    }, 1500)
  } catch (error) {
    colorPickerMessage.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    isSavingColor.value = false
  }
}

// Reset teacher color to default
const resetTeacherColor = async () => {
  if (!selectedTeacherForColor.value) return

  isSavingColor.value = true
  colorPickerMessage.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/teacher-colors/${selectedTeacherForColor.value.id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to reset color')
    }

    // Remove from local map (will use default)
    delete teacherColors.value[selectedTeacherForColor.value.id]

    colorPickerMessage.value = 'Color reset to default!'

    // Refresh calendar
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const view = calendarApi.view
      await fetchLessons(view.activeStart, view.activeEnd)
    }

    setTimeout(() => {
      showColorPickerModal.value = false
    }, 1500)
  } catch (error) {
    colorPickerMessage.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    isSavingColor.value = false
  }
}

// Close color picker modal
const closeColorPickerModal = () => {
  showColorPickerModal.value = false
  selectedTeacherForColor.value = null
  colorPickerValue.value = '#38aad9'
  colorPickerMessage.value = ''
}

// Admin notes modal state
const showNotesModal = ref(false)
const selectedParentForNotes = ref<any>(null)
const parentNote = ref('')
const noteMessage = ref('')
const isSavingNote = ref(false)
const noteTimestamp = ref('')

// Open notes modal for a parent
const openNotesModal = async (parent: any) => {
  selectedParentForNotes.value = parent
  parentNote.value = ''
  noteMessage.value = ''
  noteTimestamp.value = ''
  isSavingNote.value = false
  showNotesModal.value = true

  // Fetch existing note
  await fetchParentNote(parent.id)
}

// Fetch admin's note about a parent
const fetchParentNote = async (parentId: number) => {
  try {
    const response = await fetch(`http://localhost:8080/api/admin-notes/${parentId}`, {
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      parentNote.value = data.note_content || ''
      if (data.updated_at) {
        const date = new Date(data.updated_at)
        noteTimestamp.value = date.toLocaleDateString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    } else if (response.status === 404) {
      // No note exists yet, that's fine
      parentNote.value = ''
      noteTimestamp.value = ''
    }
  } catch (error) {
    console.error('Error fetching note:', error)
  }
}

// Save admin's note about a parent
const saveParentNote = async () => {
  if (!selectedParentForNotes.value) return

  isSavingNote.value = true
  noteMessage.value = ''

  const payload = { note_content: parentNote.value }
  console.log('Saving note for parent:', selectedParentForNotes.value.id, 'Payload:', payload)

  try {
    const response = await fetch(
      `http://localhost:8080/api/admin-notes/${selectedParentForNotes.value.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('Error response:', response.status, text)
      try {
        const errorData = JSON.parse(text)
        throw new Error(errorData.error || 'Failed to save note')
      } catch {
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
    }

    const data = await response.json()
    noteMessage.value = 'Note saved successfully!'

    // Update timestamp
    if (data.updated_at) {
      const date = new Date(data.updated_at)
      noteTimestamp.value = date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    setTimeout(() => {
      noteMessage.value = ''
    }, 2000)
  } catch (error) {
    noteMessage.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error('Save note error:', error)
  } finally {
    isSavingNote.value = false
  }
}

// Delete admin's note about a parent
const deleteParentNote = async () => {
  if (!selectedParentForNotes.value) return

  if (!confirm('Are you sure you want to delete this note?')) return

  isSavingNote.value = true
  noteMessage.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/admin-notes/${selectedParentForNotes.value.id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete note')
    }

    noteMessage.value = 'Note deleted successfully!'
    parentNote.value = ''
    noteTimestamp.value = ''

    setTimeout(() => {
      showNotesModal.value = false
    }, 1500)
  } catch (error) {
    noteMessage.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    isSavingNote.value = false
  }
}

// Close notes modal
const closeNotesModal = () => {
  showNotesModal.value = false
  selectedParentForNotes.value = null
  parentNote.value = ''
  noteMessage.value = ''
  noteTimestamp.value = ''
}

// Miro board management state
const showMiroModal = ref(false)
const selectedStudentForMiro = ref<any>(null)
const studentMiroBoards = ref<any[]>([])
const isLoadingMiroBoards = ref(false)
const miroBoardForm = ref({
  board_name: '',
  board_url: '',
})
const miroBoardMessage = ref('')
const isSavingMiroBoard = ref(false)

// Toggle user details expansion
const toggleUserDetails = (userId: number) => {
  expandedUserId.value = expandedUserId.value === userId ? null : userId
}

// Open connection creation modal
const openConnectionModal = (user: any, type: 'teacher-student' | 'parent-student') => {
  selectedUserForConnection.value = user
  connectionType.value = type
  targetUserId.value = null
  showConnectionModal.value = true
}

// Create connection as admin
const createConnection = async () => {
  if (!selectedUserForConnection.value || !targetUserId.value) {
    alert('Please select a target user')
    return
  }

  try {
    // Determine user IDs based on connection type and who initiated
    let user1Id, user2Id

    if (connectionType.value === 'teacher-student') {
      // Teacher-student connection
      if (selectedUserForConnection.value.role === 'teacher') {
        // Teacher initiated: teacher is user1, student is user2
        user1Id = selectedUserForConnection.value.id
        user2Id = targetUserId.value
      } else if (selectedUserForConnection.value.role === 'student') {
        // Student initiated: teacher is user1, student is user2
        user1Id = targetUserId.value // target is the teacher
        user2Id = selectedUserForConnection.value.id // selected is the student
      }
    } else if (connectionType.value === 'parent-student') {
      // Parent-student connection
      if (selectedUserForConnection.value.role === 'parent') {
        // Parent initiated: parent is user1, student is user2
        user1Id = selectedUserForConnection.value.id
        user2Id = targetUserId.value
      } else if (selectedUserForConnection.value.role === 'student') {
        // Student initiated: parent is user1, student is user2
        user1Id = targetUserId.value // target is the parent
        user2Id = selectedUserForConnection.value.id // selected is the student
      }
    }

    const connectionData = {
      user1_id: user1Id,
      user2_id: user2Id,
      connection_type: connectionType.value,
      created_by: selectedUserForConnection.value.id, // Admin creates it
      skip_verification: true, // Flag to bypass normal verification
    }

    console.log('Creating admin connection:', connectionData)

    const response = await fetch('http://localhost:8080/api/connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(connectionData),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to create connection'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // Response is not valid JSON, check status
        errorMessage = `Server error (${response.status}): ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    let result
    try {
      result = await response.json()
    } catch (e) {
      console.error('Failed to parse response JSON:', e)
      throw new Error('Invalid response from server')
    }
    console.log('Connection created successfully:', result)

    // Get the target user name for better feedback
    const targetUser = allUsers.value.find((u) => u.id === targetUserId.value)
    const targetUserName = targetUser
      ? `${targetUser.first_name} ${targetUser.last_name}`
      : 'selected user'

    alert(
      `Connection created successfully between ${selectedUserForConnection.value.first_name} and ${targetUserName}!`,
    )
    showConnectionModal.value = false
    selectedUserForConnection.value = null
    targetUserId.value = null

    // Refresh user data to show new connections
    fetchAllUsers()
  } catch (error) {
    console.error('Error creating connection:', error)
    alert(`Failed to create connection: ${error.message}`)
  }
}

// Get users eligible for connection with the selected user
const getEligibleUsers = computed(() => {
  if (!selectedUserForConnection.value) return []

  return allUsers.value.filter((user) => {
    // Don't include the selected user themselves
    if (user.id === selectedUserForConnection.value.id) return false

    // Filter based on connection type and who initiated
    if (connectionType.value === 'teacher-student') {
      // If selected user is teacher: need to find students
      if (selectedUserForConnection.value.role === 'teacher') {
        return user.role === 'student'
      }
      // If selected user is student: need to find teachers
      if (selectedUserForConnection.value.role === 'student') {
        return user.role === 'teacher'
      }
    } else if (connectionType.value === 'parent-student') {
      // If selected user is parent: need to find students
      if (selectedUserForConnection.value.role === 'parent') {
        return user.role === 'student'
      }
      // If selected user is student: need to find parents
      if (selectedUserForConnection.value.role === 'student') {
        return user.role === 'parent'
      }
    }
    return false
  })
})

const filteredUsers = computed(() => {
  let filtered = [...allUsers.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (user) =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        (user.phone && user.phone.toLowerCase().includes(query)),
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]

    // Handle undefined/null values
    if (!aValue) aValue = ''
    if (!bValue) bValue = ''

    // Convert to string for comparison
    aValue = String(aValue).toLowerCase()
    bValue = String(bValue).toLowerCase()

    if (sortDirection.value === 'asc') {
      return aValue.localeCompare(bValue)
    } else {
      return bValue.localeCompare(aValue)
    }
  })

  return filtered
})

// Function to handle column sorting
const sortBy = (field: 'first_name' | 'last_name' | 'email' | 'role' | 'phone') => {
  if (sortField.value === field) {
    // Toggle direction if clicking the same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, default to ascending
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Get sort indicator for a column
const getSortIndicator = (field: string) => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}
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

    // Fetch lessons
    const lessonsResponse = await fetch(
      `http://localhost:8080/api/lessons?start_date=${startStr}&end_date=${endStr}`,
      {
        credentials: 'include',
      },
    )

    if (!lessonsResponse.ok) {
      throw new Error('Failed to fetch lessons')
    }

    const lessonsData = await lessonsResponse.json()
    console.log('Fetched lessons:', lessonsData.lessons)

    // Fetch teacher colors
    try {
      const colorsResponse = await fetch('http://localhost:8080/api/teacher-colors', {
        credentials: 'include',
      })

      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json()
        // Populate teacherColors with custom colors from backend
        if (colorsData.colors) {
          Object.entries(colorsData.colors).forEach(([teacherId, color]) => {
            if (color !== null) {
              teacherColors.value[parseInt(teacherId)] = color as string
            }
          })
        }
        console.log('Teacher colors loaded:', teacherColors.value)
      }
    } catch (colorError) {
      console.error('Error fetching teacher colors:', colorError)
      // Continue without colors - will use defaults
    }

    const events = lessonsData.lessons.map((lesson: any) => {
      const teacherColor = getTeacherColor(lesson.teacher_id)
      return {
        id: lesson.id.toString(),
        title: `${lesson.subject_name} - ${lesson.teacher_name}\n${lesson.student_name}`,
        start: lesson.start_time,
        end: lesson.end_time,
        backgroundColor: teacherColor,
        borderColor: teacherColor,
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
      }
    })

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
  events: [], // Start with empty array
  slotMinTime: '08:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:15:00',
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    meridiem: false,
  },
  // Add more visual separation
  slotEventOverlap: false,
  eventMaxStack: 1,
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

// Generate background events for break periods
const generateBreakPeriods = (start: Date, end: Date) => {
  const breakEvents = []
  const current = new Date(start)

  // Loop through each day in the visible range
  while (current <= end) {
    const dayOfWeek = current.getDay()

    // Only show breaks on weekdays (1-5 = Monday-Friday) and Saturday (6)
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
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

  // Predefined break times (more efficient than calculating)
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
    const [startHour, startMinute] = breakTime.start.split(':').map(Number)
    breakStart.setHours(startHour, startMinute, 0, 0)

    const breakEnd = new Date(date)
    const [endHour, endMinute] = breakTime.end.split(':').map(Number)
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
// Add this function to generate available lesson slots
const generateAvailableSlots = (start: Date, end: Date) => {
  const slotEvents = []
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()

    // Only show available slots on weekdays (1-5 = Monday-Friday) and Saturday (6)
    if (dayOfWeek >= 0 && dayOfWeek <= 6) {
      const daySlots = generateSlotsForDay(current)
      slotEvents.push(...daySlots)
    }

    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }

  return slotEvents
}

// Replace generateSlotsForDay with this simpler version
const generateSlotsForDay = (date: Date) => {
  // Just create one background event for the entire available day
  // This is much more performant than creating individual slots
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
// Add with your other refs
const allUsers = ref<any[]>([])
const showUserManagement = () => {
  currentView.value = 'user-management'
  fetchAllUsers()
}
// Fetch all users from backend
const fetchAllUsers = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/users', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    console.log('Fetched all users:', data.users)
    allUsers.value = data.users || []
  } catch (error) {
    console.error('Error fetching users:', error)
    allUsers.value = []
  }
}

// Navigation function for user management
const showUserManagementView = () => {
  currentView.value = 'user-management'
  fetchAllUsers()
}

// Placeholder function for manage user (to be implemented later)
const manageUser = (user: any) => {
  console.log('Managing user:', user)
  alert(
    `Manage user: ${user.first_name} ${user.last_name} (${user.role})\n\nThis feature will allow creating connections between users.`,
  )
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

  // Use nextTick to ensure the calendar is fully rendered
  nextTick(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() - now.getDay() + 7)

    // Manually set initial background events
    const calendarApi = getCalendarApi()
    if (calendarApi) {
      const backgroundEvents = [
        ...generateBreakPeriods(startOfWeek, endOfWeek),
        ...generateAvailableSlots(startOfWeek, endOfWeek),
      ]
      calendarApi.addEventSource(backgroundEvents)
      fetchLessons(startOfWeek, endOfWeek)
    } else {
      // If calendar API isn't available yet, try again after a short delay
      setTimeout(() => {
        const calendarApi = getCalendarApi()
        if (calendarApi) {
          const backgroundEvents = [
            ...generateBreakPeriods(startOfWeek, endOfWeek),
            ...generateAvailableSlots(startOfWeek, endOfWeek),
          ]
          calendarApi.addEventSource(backgroundEvents)
          fetchLessons(startOfWeek, endOfWeek)
        }
      }, 100)
    }
  })
})
// Add with your other refs
const recurringOption = ref<'this' | 'all'>('this')

// Reset recurring option when modal opens
watch(showMoveConfirmModal, (newVal) => {
  if (newVal && movedEventInfo.value?.isRecurring) {
    recurringOption.value = 'this'
  }
})
// Placeholder functions for quick actions
const editUserProfile = (user: any) => {
  alert(`Edit profile for ${user.first_name} ${user.last_name} (Coming soon)`)
}

const resetUserPassword = (user: any) => {
  if (confirm(`Reset password for ${user.first_name} ${user.last_name}?`)) {
    alert(`Password reset link sent to ${user.email} (Coming soon)`)
  }
}

const viewUserLessons = (user: any) => {
  alert(`View lessons for ${user.first_name} ${user.last_name} (Coming soon)`)
}

const deactivateUser = (user: any) => {
  if (
    confirm(
      `Deactivate ${user.first_name} ${user.last_name}? This will prevent them from logging in.`,
    )
  ) {
    alert(`User ${user.first_name} ${user.last_name} deactivated (Coming soon)`)
  }
}

// Miro Board Management Functions
const openMiroBoardModal = async (user: any) => {
  if (user.role !== 'student') {
    alert('Miro boards can only be assigned to students')
    return
  }

  selectedStudentForMiro.value = user
  miroBoardForm.value = { board_name: '', board_url: '' }
  miroBoardMessage.value = ''
  showMiroModal.value = true

  // Fetch existing boards for this student
  await fetchStudentMiroBoards(user.id)
}

const fetchStudentMiroBoards = async (studentId: number) => {
  isLoadingMiroBoards.value = true
  try {
    const response = await fetch(`http://localhost:8080/api/students/${studentId}/miro-boards`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Miro boards')
    }

    const data = await response.json()
    studentMiroBoards.value = data.miroBoards || []
  } catch (error) {
    console.error('Error fetching Miro boards:', error)
    studentMiroBoards.value = []
    miroBoardMessage.value = 'Failed to load boards'
  } finally {
    isLoadingMiroBoards.value = false
  }
}

const validateBoardUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

const addMiroBoard = async () => {
  // Use "board" as default if nothing is typed
  const boardName = miroBoardForm.value.board_name.trim() || 'board'
  
  if (!miroBoardForm.value.board_url.trim()) {
    miroBoardMessage.value = 'Board URL is required'
    return
  }

  if (!validateBoardUrl(miroBoardForm.value.board_url)) {
    miroBoardMessage.value = 'Invalid URL. Please enter a valid HTTP/HTTPS link'
    return
  }

  if (boardName.length > 50) {
    miroBoardMessage.value = 'Board name must be 50 characters or less'
    return
  }

  isSavingMiroBoard.value = true
  miroBoardMessage.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/students/${selectedStudentForMiro.value.id}/miro-boards`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          board_name: boardName,
          board_url: miroBoardForm.value.board_url.trim(),
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add board')
    }

    const result = await response.json()
    miroBoardForm.value = { board_name: '', board_url: '' }
    miroBoardMessage.value = 'Board added successfully!'

    // Refresh the boards list
    await fetchStudentMiroBoards(selectedStudentForMiro.value.id)

    // Clear message after 2 seconds
    setTimeout(() => {
      miroBoardMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('Error adding Miro board:', error)
    miroBoardMessage.value = `Error: ${error.message}`
  } finally {
    isSavingMiroBoard.value = false
  }
}

const deleteMiroBoard = async (boardId: number) => {
  if (!confirm('Are you sure you want to delete this board?')) {
    return
  }

  try {
    const response = await fetch(
      `http://localhost:8080/api/students/${selectedStudentForMiro.value.id}/miro-boards/${boardId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete board')
    }

    miroBoardMessage.value = 'Board deleted successfully'

    // Refresh the boards list
    await fetchStudentMiroBoards(selectedStudentForMiro.value.id)

    // Clear message after 2 seconds
    setTimeout(() => {
      miroBoardMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('Error deleting Miro board:', error)
    miroBoardMessage.value = `Error: ${error.message}`
  }
}

const closeMiroBoardModal = () => {
  showMiroModal.value = false
  selectedStudentForMiro.value = null
  studentMiroBoards.value = []
  miroBoardForm.value = { board_name: '', board_url: '' }
  miroBoardMessage.value = ''
}
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
    <!-- Connection Creation Modal -->
    <div v-if="showConnectionModal" class="modal-overlay" @click="showConnectionModal = false">
      <div class="modal-content connection-modal" @click.stop>
        <div class="modal-header">
          <h2>Create Connection</h2>
          <button class="close-btn" @click="showConnectionModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="connection-info" v-if="selectedUserForConnection">
            <div class="user-display">
              <div class="user-avatar">
                {{ selectedUserForConnection.first_name.charAt(0)
                }}{{ selectedUserForConnection.last_name.charAt(0) }}
              </div>
              <div class="user-details">
                <h3>
                  {{ selectedUserForConnection.first_name }}
                  {{ selectedUserForConnection.last_name }}
                </h3>
                <div class="user-meta">
                  <span class="role-badge" :class="`role-${selectedUserForConnection.role}`">
                    {{ selectedUserForConnection.role }}
                  </span>
                  <span class="connection-type">→ {{ connectionType.replace('-', ' to ') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="connection-form">
            <div class="form-group">
              <label
                >Select {{ connectionType === 'teacher-student' ? 'Student' : 'Student' }} to
                Connect:</label
              >
              <div class="users-selector">
                <div
                  v-for="targetUser in getEligibleUsers"
                  :key="targetUser.id"
                  class="user-option"
                  :class="{ selected: targetUserId === targetUser.id }"
                  @click="targetUserId = targetUser.id"
                >
                  <div class="option-avatar">
                    {{ targetUser.first_name.charAt(0) }}{{ targetUser.last_name.charAt(0) }}
                  </div>
                  <div class="option-details">
                    <div class="option-name">
                      {{ targetUser.first_name }} {{ targetUser.last_name }}
                    </div>
                    <div class="option-email">{{ targetUser.email }}</div>
                  </div>
                  <div class="option-check" v-if="targetUserId === targetUser.id">✓</div>
                </div>

                <div v-if="getEligibleUsers.length === 0" class="no-users">
                  No eligible users found for this connection type.
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="showConnectionModal = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn-create"
                @click="createConnection"
                :disabled="!targetUserId"
              >
                Create Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher Color Picker Modal -->
    <div v-if="showColorPickerModal" class="modal-overlay" @click="closeColorPickerModal">
      <div class="modal-content color-picker-modal" @click.stop>
        <div class="modal-header">
          <h2>Set Teacher Color</h2>
          <button class="close-btn" @click="closeColorPickerModal">×</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedTeacherForColor" class="color-picker-content">
            <!-- Teacher Info -->
            <div class="teacher-display">
              <h3>
                {{ selectedTeacherForColor.first_name }} {{ selectedTeacherForColor.last_name }}
              </h3>
              <p>{{ selectedTeacherForColor.email }}</p>
            </div>

            <!-- Color Preview -->
            <div class="color-preview-section">
              <div class="color-preview" :style="{ backgroundColor: colorPickerValue }"></div>
            </div>

            <!-- Color Input Options -->
            <div class="color-input-section">
              <!-- HTML Color Picker -->
              <div class="form-group">
                <label for="color-picker">Pick a color:</label>
                <input
                  id="color-picker"
                  v-model="colorPickerValue"
                  type="color"
                  class="color-picker-input"
                />
              </div>

              <!-- Hex Code Input -->
              <div class="form-group">
                <label for="hex-input">Or enter hex code:</label>
                <input
                  id="hex-input"
                  v-model="colorPickerValue"
                  type="text"
                  placeholder="#38aad9"
                  class="form-input hex-input"
                  @input="colorPickerValue = colorPickerValue.toUpperCase()"
                />
                <small v-if="!isValidHexColor(colorPickerValue)" class="error-text">
                  Invalid format. Use #RRGGBB (e.g., #38AAD9)
                </small>
              </div>
            </div>

            <!-- Message -->
            <div
              v-if="colorPickerMessage"
              class="message"
              :class="{ success: colorPickerMessage.includes('successfully') }"
            >
              {{ colorPickerMessage }}
            </div>

            <!-- Actions -->
            <div class="color-picker-actions">
              <button
                type="button"
                class="btn-cancel"
                @click="closeColorPickerModal"
                :disabled="isSavingColor"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn-reset"
                @click="resetTeacherColor"
                :disabled="isSavingColor"
              >
                Reset to Default
              </button>
              <button
                type="button"
                class="btn-save"
                @click="saveTeacherColor"
                :disabled="!isValidHexColor(colorPickerValue) || isSavingColor"
              >
                {{ isSavingColor ? 'Saving...' : 'Save Color' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Notes Modal -->
    <div v-if="showNotesModal" class="modal-overlay" @click="closeNotesModal">
      <div class="modal-content notes-modal" @click.stop>
        <div class="modal-header">
          <h2>Parent Notes</h2>
          <button class="close-btn" @click="closeNotesModal">×</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedParentForNotes" class="notes-content">
            <!-- Parent Info -->
            <div class="parent-display">
              <h3>
                {{ selectedParentForNotes.first_name }} {{ selectedParentForNotes.last_name }}
              </h3>
              <p>{{ selectedParentForNotes.email }}</p>
              <p v-if="noteTimestamp" class="note-timestamp">Last updated: {{ noteTimestamp }}</p>
            </div>

            <!-- Notes Textarea -->
            <div class="form-group">
              <label for="notes-textarea">Notes:</label>
              <textarea
                id="notes-textarea"
                v-model="parentNote"
                class="notes-textarea"
                placeholder="Add your personal notes about this parent here..."
              ></textarea>
            </div>

            <!-- Message -->
            <div
              v-if="noteMessage"
              class="message"
              :class="{ success: noteMessage.includes('successfully') }"
            >
              {{ noteMessage }}
            </div>

            <!-- Actions -->
            <div class="notes-actions">
              <button
                type="button"
                class="btn-cancel"
                @click="closeNotesModal"
                :disabled="isSavingNote"
              >
                Cancel
              </button>
              <button
                v-if="parentNote"
                type="button"
                class="btn-danger"
                @click="deleteParentNote"
                :disabled="isSavingNote"
              >
                Delete Note
              </button>
              <button
                type="button"
                class="btn-save"
                @click="saveParentNote"
                :disabled="isSavingNote"
              >
                {{ isSavingNote ? 'Saving...' : 'Save Note' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Miro Board Management Modal -->
    <div v-if="showMiroModal" class="modal-overlay" @click="closeMiroBoardModal">
      <div class="modal-content miro-modal" @click.stop>
        <div class="modal-header">
          <h2>Manage Miro Boards</h2>
          <button class="close-btn" @click="closeMiroBoardModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Student Info -->
          <div class="miro-student-info" v-if="selectedStudentForMiro">
            <div class="student-display">
              <div class="student-avatar">
                {{ selectedStudentForMiro.first_name.charAt(0)
                }}{{ selectedStudentForMiro.last_name.charAt(0) }}
              </div>
              <div class="student-details">
                <h3>
                  {{ selectedStudentForMiro.first_name }} {{ selectedStudentForMiro.last_name }}
                </h3>
                <p class="student-email">{{ selectedStudentForMiro.email }}</p>
              </div>
            </div>
          </div>

          <!-- Add Board Form -->
          <div class="miro-form">
            <h4>Add New Miro Board</h4>
            <div class="form-group">
              <label for="board-name">Board Name:</label>
              <input
                id="board-name"
                v-model="miroBoardForm.board_name"
                type="text"
                placeholder="board"
                class="form-input"
                maxlength="50"
              />
              <div class="input-hint">
                Max 50 characters ({{ miroBoardForm.board_name.length }}/50)
              </div>
            </div>

            <div class="form-group">
              <label for="board-url">Board URL:</label>
              <input
                id="board-url"
                v-model="miroBoardForm.board_url"
                type="text"
                placeholder="https://miro.com/app/board/..."
                class="form-input"
              />
              <div class="input-hint">Must start with https:// or http://</div>
            </div>

            <div
              v-if="miroBoardMessage"
              class="message"
              :class="miroBoardMessage.includes('Error') ? 'error' : 'success'"
            >
              {{ miroBoardMessage }}
            </div>

            <button @click="addMiroBoard" :disabled="isSavingMiroBoard" class="btn-add-board">
              {{ isSavingMiroBoard ? 'Adding...' : '+ Add Board' }}
            </button>
          </div>

          <!-- Existing Boards -->
          <div class="miro-boards-list">
            <h4>Existing Boards ({{ studentMiroBoards.length }})</h4>

            <div v-if="isLoadingMiroBoards" class="loading-state">Loading boards...</div>

            <div v-else-if="studentMiroBoards.length === 0" class="empty-state">
              <p>No boards added yet. Create one above to get started!</p>
            </div>

            <div v-else class="boards-table">
              <div v-for="board in studentMiroBoards" :key="board.id" class="board-item">
                <div class="board-info">
                  <div class="board-name">{{ board.board_name }}</div>
                  <div class="board-url">
                    <a :href="board.board_url" target="_blank" rel="noopener noreferrer">
                      {{ board.board_url.substring(0, 50) }}...
                    </a>
                  </div>
                </div>
                <button
                  @click="deleteMiroBoard(board.id)"
                  class="btn-delete-board"
                  title="Delete this board"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button @click="closeMiroBoardModal" class="btn-close">Done</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Cards View -->
    <div v-if="currentView === 'main'">
      <h1>Admin Panel</h1>
      <div class="admin-grid">
        <button class="admin-card" @click="showUserManagement">
          <h3>User Management</h3>
          <p>Create and manage user connections</p>
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
    <div v-else-if="currentView === 'user-management'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Admin Panel</button>
        <h1>User Management</h1>
      </div>
      <div class="section-content">
        <div class="users-header">
          <h2>All System Users</h2>
          <p>Manage user connections and profiles</p>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users by name, email, role, or phone..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
              title="Clear search"
            >
              ✕
            </button>
          </div>
          <div class="search-info" v-if="searchQuery">
            Found {{ filteredUsers.length }} user{{
              filteredUsers.length !== 1 ? 's' : ''
            }}
            matching "{{ searchQuery }}"
          </div>
        </div>

        <!-- Users Table -->
        <div class="users-table-container" v-if="filteredUsers.length > 0">
          <table class="users-table">
            <thead>
              <tr>
                <th @click="sortBy('first_name')" class="sortable-header">
                  <div class="header-content">
                    <span>Name</span>
                    <span class="sort-indicator">{{ getSortIndicator('first_name') }}</span>
                  </div>
                </th>
                <th @click="sortBy('email')" class="sortable-header">
                  <div class="header-content">
                    <span>Email</span>
                    <span class="sort-indicator">{{ getSortIndicator('email') }}</span>
                  </div>
                </th>
                <th @click="sortBy('role')" class="sortable-header">
                  <div class="header-content">
                    <span>Role</span>
                    <span class="sort-indicator">{{ getSortIndicator('role') }}</span>
                  </div>
                </th>
                <th @click="sortBy('phone')" class="sortable-header">
                  <div class="header-content">
                    <span>Phone</span>
                    <span class="sort-indicator">{{ getSortIndicator('phone') }}</span>
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="user in filteredUsers" :key="user.id">
                <!-- User Row -->
                <tr class="user-row">
                  <td class="user-name">
                    <strong>{{ user.first_name }} {{ user.last_name }}</strong>
                    <div class="user-id">ID: {{ user.id }}</div>
                  </td>
                  <td class="user-email">{{ user.email }}</td>
                  <td class="user-role">
                    <span :class="`role-badge role-${user.role}`">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="user-phone">{{ user.phone || 'N/A' }}</td>
                  <td class="user-actions">
                    <button
                      @click="toggleUserDetails(user.id)"
                      class="btn-manage"
                      :title="`${expandedUserId === user.id ? 'Hide' : 'Show'} details for ${user.first_name} ${user.last_name}`"
                    >
                      {{ expandedUserId === user.id ? 'Hide' : 'Manage' }}
                    </button>
                  </td>
                </tr>

                <!-- Expanded Details Row (only show if this user is expanded) -->
                <tr v-if="expandedUserId === user.id" class="user-details-row">
                  <td colspan="5" class="details-container">
                    <div class="user-details">
                      <div class="details-grid">
                        <!-- User Information -->
                        <div class="details-section">
                          <h4>User Information</h4>
                          <div class="info-grid">
                            <div class="info-item">
                              <span class="info-label">Full Name:</span>
                              <span class="info-value"
                                >{{ user.first_name }} {{ user.last_name }}</span
                              >
                            </div>
                            <div class="info-item">
                              <span class="info-label">Email:</span>
                              <span class="info-value">{{ user.email }}</span>
                            </div>
                            <div class="info-item">
                              <span class="info-label">Phone:</span>
                              <span class="info-value">{{ user.phone || 'Not provided' }}</span>
                            </div>
                            <div class="info-item">
                              <span class="info-label">Date of Birth:</span>
                              <span class="info-value">{{
                                user.date_of_birth || 'Not provided'
                              }}</span>
                            </div>
                            <div class="info-item">
                              <span class="info-label">Account Created:</span>
                              <span class="info-value">{{
                                new Date(user.created_at).toLocaleDateString()
                              }}</span>
                            </div>
                            <div class="info-item">
                              <span class="info-label">User ID:</span>
                              <span class="info-value code">{{ user.id }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Connection Management -->
                        <div class="details-section">
                          <h4>Connection Management</h4>
                          <div class="connection-actions">
                            <div v-if="user.role === 'teacher'" class="action-group">
                              <h5>Connect as Teacher</h5>
                              <p class="action-description">
                                Create teacher-student connection with a student
                              </p>
                              <button
                                @click="openConnectionModal(user, 'teacher-student')"
                                class="btn-action"
                              >
                                📚 Connect to Student
                              </button>
                            </div>

                            <div v-if="user.role === 'parent'" class="action-group">
                              <h5>Connect as Parent</h5>
                              <p class="action-description">
                                Create parent-student connection with a student
                              </p>
                              <button
                                @click="openConnectionModal(user, 'parent-student')"
                                class="btn-action"
                              >
                                👨‍👧 Connect to Student
                              </button>
                            </div>

                            <div v-if="user.role === 'student'" class="action-group">
                              <h5>Connect Student To</h5>
                              <p class="action-description">
                                Connect this student to a teacher or parent.
                              </p>
                              <div class="student-connections">
                                <button
                                  @click="openConnectionModal(user, 'teacher-student')"
                                  class="btn-action"
                                >
                                  👨‍🏫 Connect to Teacher
                                </button>
                                <button
                                  @click="openConnectionModal(user, 'parent-student')"
                                  class="btn-action"
                                >
                                  👨‍👧 Connect to Parent
                                </button>
                              </div>
                            </div>

                            <div v-if="user.role === 'admin'" class="action-group">
                              <h5>Admin User</h5>
                              <p class="action-description">
                                Admin users don't participate in teacher-student/parent-student
                                connections.
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="details-section">
                          <h4>Quick Actions</h4>
                          <div class="quick-actions">
                            <button class="btn-quick-action" @click="editUserProfile(user)">
                              ✏️ Edit Profile
                            </button>
                            <button class="btn-quick-action" @click="resetUserPassword(user)">
                              🔒 Reset Password
                            </button>
                            <button class="btn-quick-action" @click="viewUserLessons(user)">
                              📅 View Lessons
                            </button>
                            <button
                              v-if="user.role === 'teacher'"
                              class="btn-quick-action"
                              @click="openColorPickerModal(user)"
                              :style="{ backgroundColor: getTeacherColor(user.id) }"
                              title="Set teacher color"
                            >
                              🎨 Set Color
                            </button>
                            <button
                              v-if="user.role === 'parent'"
                              class="btn-quick-action"
                              @click="openNotesModal(user)"
                              title="Add/edit personal notes"
                            >
                              📝 Notes
                            </button>
                            <button
                              v-if="user.role === 'student'"
                              class="btn-quick-action btn-miro"
                              @click="openMiroBoardModal(user)"
                            >
                              🎨 Manage Miro Boards
                            </button>
                            <button
                              class="btn-quick-action btn-danger"
                              @click="deactivateUser(user)"
                            >
                              ⚠️ Deactivate User
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>{{ searchQuery ? 'No Matching Users' : 'No Users Found' }}</h3>
          <p v-if="searchQuery">
            No users found matching "{{ searchQuery }}". Try a different search term.
          </p>
          <p v-else>There are no users registered in the system yet.</p>
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">
            Clear Search
          </button>
        </div>

        <!-- Statistics -->
        <div class="user-stats" v-if="allUsers.length > 0">
          <div class="stat-card">
            <div class="stat-number">{{ allUsers.length }}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ allUsers.filter((u) => u.role === 'student').length }}</div>
            <div class="stat-label">Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ allUsers.filter((u) => u.role === 'teacher').length }}</div>
            <div class="stat-label">Teachers</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ allUsers.filter((u) => u.role === 'parent').length }}</div>
            <div class="stat-label">Parents</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ allUsers.filter((u) => u.role === 'admin').length }}</div>
            <div class="stat-label">Admins</div>
          </div>
        </div>
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
/* Enhanced available slot styling */
:deep(.available-slot) {
  background: repeating-linear-gradient(
    45deg,
    rgba(56, 170, 217, 0.05),
    rgba(56, 170, 217, 0.05) 10px,
    rgba(56, 170, 217, 0.08) 10px,
    rgba(56, 170, 217, 0.08) 20px
  ) !important;
  border-left: 3px solid rgba(56, 170, 217, 0.3) !important;
  border-right: 1px solid rgba(56, 170, 217, 0.1) !important;
}

/* Make break periods more distinct */
:deep(.break-period) {
  background: repeating-linear-gradient(
    -45deg,
    #ffebee,
    #ffebee 10px,
    #ffcdd2 10px,
    #ffcdd2 20px
  ) !important;
  border: 2px solid #ffcdd2 !important;
  opacity: 0.8;
}

/* Highlight the current time slot */
:deep(.fc-timegrid-now-indicator-line) {
  border-color: #ff6b6b !important;
  border-width: 2px !important;
}

/* Style for actual lessons to stand out more */
:deep(.fc-event) {
  z-index: 100 !important;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16) !important;
  border: none !important;
  font-weight: 600 !important;
}

/* Hover effects */
:deep(.available-slot:hover) {
  background: repeating-linear-gradient(
    45deg,
    rgba(56, 170, 217, 0.1),
    rgba(56, 170, 217, 0.1) 10px,
    rgba(56, 170, 217, 0.15) 10px,
    rgba(56, 170, 217, 0.15) 20px
  ) !important;
} /* User Management Styles */
.users-header {
  margin-bottom: 2rem;
  text-align: center;
}

.users-header h2 {
  color: #6c0f5f;
  margin-bottom: 0.5rem;
}

.users-header p {
  color: #666;
  font-size: 1.1rem;
}

.users-table-container {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #6c0f5f;
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.user-row:hover {
  background: #f8f9fa;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-email {
  color: #666;
}

.user-role {
  text-transform: capitalize;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-student {
  background: #e3f2fd;
  color: #1976d2;
}

.role-teacher {
  background: #e8f5e8;
  color: #2e7d32;
}

.role-parent {
  background: #fff3e0;
  color: #ef6c00;
}

.role-admin {
  background: #fce4ec;
  color: #c2185b;
}

.user-phone {
  color: #666;
  font-family: monospace;
}

.user-actions {
  text-align: center;
}

.btn-manage {
  background: #38aad9;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-manage:hover {
  background: #2a8fc7;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #6c0f5f;
  margin-bottom: 0.5rem;
}

/* User Statistics */
.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #6c0f5f;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #6c0f5f;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
/* Search Bar Styles */
.search-container {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c0f5f;
  font-size: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #6c0f5f;
  box-shadow: 0 0 0 3px rgba(108, 15, 95, 0.1);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.clear-search:hover {
  background: #5a6268;
}

.search-info {
  text-align: center;
  margin-top: 0.5rem;
  color: #6c0f5f;
  font-size: 0.9rem;
}

.btn-clear-search {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.btn-clear-search:hover {
  background: #5a6268;
}

/* Sortable Table Headers */
.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
}

.sortable-header:hover {
  background: rgba(108, 15, 95, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0.5rem;
}

.sort-indicator {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.sortable-header:hover .sort-indicator {
  opacity: 1;
}

/* Enhanced User Table Styles */
.user-name {
  position: relative;
}

.user-id {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  font-family: monospace;
  opacity: 0.7;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .users-table-container {
    overflow-x: auto;
  }

  .users-table {
    min-width: 700px;
  }

  .search-input {
    font-size: 0.9rem;
    padding: 0.6rem 1rem 0.6rem 2.5rem;
  }

  .search-icon {
    left: 0.8rem;
    font-size: 1rem;
  }

  .user-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .stat-number {
    font-size: 1.5rem;
  }
}
/* User Details Row */
.user-details-row {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.details-container {
  padding: 0 !important;
}

.user-details {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.details-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.details-section h4 {
  color: #6c0f5f;
  margin-top: 0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 500;
  color: #333;
}

.info-value.code {
  font-family: monospace;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Connection Actions */
.connection-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-group h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.action-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.btn-action {
  background: #38aad9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  text-align: center;
}

.btn-action:hover {
  background: #2a8fc7;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-action.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.student-connections {
  display: flex;
  gap: 1rem;
}

.student-connections .btn-action {
  flex: 1;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-quick-action {
  background: white;
  border: 2px solid #e0e0e0;
  color: #333;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-quick-action:hover {
  border-color: #6c0f5f;
  background: #f8f9fa;
  transform: translateX(5px);
}

.btn-quick-action.btn-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-quick-action.btn-danger:hover {
  background: #dc3545;
  color: white;
}

/* Connection Modal */
.connection-modal {
  max-width: 600px;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: #6c0f5f;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.connection-type {
  font-weight: 600;
  color: #6c0f5f;
}

.users-selector {
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.user-option:hover {
  background: #f8f9fa;
}

.user-option.selected {
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.user-option:last-child {
  border-bottom: none;
}

.option-avatar {
  width: 40px;
  height: 40px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.option-details {
  flex: 1;
}

.option-name {
  font-weight: 600;
  color: #333;
}

.option-email {
  font-size: 0.9rem;
  color: #666;
}

.option-check {
  color: #1976d2;
  font-weight: bold;
  font-size: 1.2rem;
}

.no-users {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
}

/* Color Picker Modal Styles */
.color-picker-modal {
  max-width: 450px;
}

.color-picker-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.teacher-display {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #6c0f5f;
  text-align: center;
}

.teacher-display h3 {
  margin: 0 0 0.5rem 0;
  color: #6c0f5f;
}

.teacher-display p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.color-preview-section {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.color-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 3px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-input-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.color-picker-input {
  width: 100%;
  height: 50px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.hex-input {
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.error-text {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.color-picker-actions {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-reset {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-reset:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  background: #ffebee;
}

/* Notes Modal Styles */
.notes-modal {
  max-width: 550px;
}

.notes-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.parent-display {
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #6c0f5f;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.parent-display h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 600;
}

.parent-display p {
  margin: 0;
  font-size: 0.95rem;
  color: #6c757d;
}

.notes-textarea {
  width: 100%;
  min-height: 180px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.notes-textarea:focus {
  outline: none;
  border-color: #6c0f5f;
  box-shadow: 0 0 0 3px rgba(108, 15, 95, 0.1);
}

.notes-textarea::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.note-timestamp {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0.25rem 0 0 0;
  font-style: italic;
}

.notes-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.notes-actions button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notes-actions .btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.notes-actions .btn-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.notes-actions .btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notes-actions .btn-danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.notes-actions .btn-danger:hover:not(:disabled) {
  background: #fecaca;
  border-color: #f87171;
}

.notes-actions .btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notes-actions .btn-save {
  background: #6c0f5f;
  color: white;
}

.notes-actions .btn-save:hover:not(:disabled) {
  background: #55094b;
  box-shadow: 0 4px 12px rgba(108, 15, 95, 0.3);
}

.notes-actions .btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message.success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.message.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

/* Miro Board Modal Styles */
.miro-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.miro-student-info {
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f2d422;
  margin-bottom: 1.5rem;
}

.student-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a1f, #ffc107);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.student-details h3 {
  margin: 0;
  color: #2b2b2b;
  font-size: 1.1rem;
}

.student-email {
  margin: 0.3rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.miro-form {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.miro-form h4 {
  margin: 0 0 1rem 0;
  color: #2b2b2b;
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #ff9a1f;
  box-shadow: 0 0 0 3px rgba(255, 154, 31, 0.1);
}

.input-hint {
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.3rem;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.message.error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.btn-add-board {
  width: 100%;
  padding: 0.75rem;
  background: #ff9a1f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-board:hover:not(:disabled) {
  background: #ff8800;
  transform: translateY(-2px);
}

.btn-add-board:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.miro-boards-list {
  margin-bottom: 1.5rem;
}

.miro-boards-list h4 {
  margin: 0 0 1rem 0;
  color: #2b2b2b;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 6px;
  color: #666;
}

.boards-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.board-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.board-item:hover {
  border-color: #ff9a1f;
  box-shadow: 0 2px 8px rgba(255, 154, 31, 0.1);
}

.board-info {
  flex: 1;
  min-width: 0;
}

.board-name {
  font-weight: 600;
  color: #2b2b2b;
  margin-bottom: 0.3rem;
}

.board-url {
  font-size: 0.85rem;
  color: #666;
}

.board-url a {
  color: #ff9a1f;
  text-decoration: none;
  word-break: break-all;
}

.board-url a:hover {
  text-decoration: underline;
}

.btn-delete-board {
  padding: 0.5rem 0.75rem;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #c62828;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  margin-left: 1rem;
}

.btn-delete-board:hover {
  background: #c62828;
  color: white;
  transform: translateY(-2px);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.btn-close {
  padding: 0.75rem 1.5rem;
  background: #2b2b2b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #ff9a1f;
  transform: translateY(-2px);
}

.btn-miro {
  color: #000;
}

.btn-miro:hover {
  background: #ffd500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .student-connections {
    flex-direction: column;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .board-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-delete-board {
    margin-left: 0;
    margin-top: 0.5rem;
    width: 100%;
  }
}
</style>
