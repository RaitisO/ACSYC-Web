<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useAuth } from '@/composables'
import { useCalendarLessons } from '@/composables/useCalendarLessons'
import { useConnectionStore } from '@/stores'
import '../../styles/views/dashboards.css'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ProfileSection from '@/components/sections/ProfileSection.vue'
import LessonFormModal from '@/components/modals/LessonFormModal.vue'
import ConfirmMoveModal from '@/components/modals/ConfirmMoveModal.vue'
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal.vue'

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

// Composables & Stores
const { getCurrentUserId } = useAuth()
const connectionStore = useConnectionStore()

// Computed: students from connection store
const connectedStudents = computed(() =>
  connectionStore.connections.filter((c) => c.role === 'student'),
)

// Initialize calendar composable
const calendarLessons = useCalendarLessons(getCurrentUserId)
const {
  lessons,
  subjects,
  students,
  showLessonModal,
  showEditModal,
  showMoveConfirmModal,
  showDeleteConfirmModal,
  newLesson,
  selectedLesson,
  movedEventInfo,
  recurringOption,
  isCreatingLesson,
  isUpdatingLesson,
  isDeletingLesson,
  lessonMessage,
  editMessage,
  fetchLessons,
  fetchDropdownData,
  createLesson,
  updateLesson,
  deleteLesson,
  confirmEventMove,
  handleDateSelect: composableHandleDateSelect,
  handleEventClick: composableHandleEventClick,
  handleEventDrop: composableHandleEventDrop,
  closeModal,
  closeEditModal,
  closeDeleteConfirmModal,
  closeMoveConfirmModal,
  openDeleteConfirmModal,
  formatForDateTimeInput,
  formatForBackend,
  formatDateTime,
  calculateEndTime,
} = calendarLessons

// View state
const currentView = ref<'main' | 'students' | 'calendar' | 'subjects' | 'profile'>(
  'main',
)

// Calendar state
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)

// Navigation functions
const showStudents = async () => {
  currentView.value = 'students'
  await connectionStore.fetchConnections()
}
const showCalendar = () => {
  currentView.value = 'calendar'
  // Calendar will auto-fetch on datesSet when mounted
}
const showSubjects = () => (currentView.value = 'subjects')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch connected users (students)
const fetchConnectedUsers = async () => {
  try {
    await connectionStore.fetchConnections()
  } catch (error) {
    console.error('Error fetching connected users:', error)
  }
}

// Fetch and display lessons for this teacher's view
const fetchTeacherLessons = async (start: Date, end: Date) => {
  try {
    await fetchLessons(start, end)

    // Convert lessons to calendar events
    const calendarApi = getCalendarApi()
    if (calendarApi && lessons.value) {
      calendarApi.removeAllEvents()

      const events = lessons.value.map((lesson) => {
        const isOwned = lesson.teacher_id === getCurrentUserId()
        return {
          id: String(lesson.id),
          title: isOwned
            ? `${lesson.subject_name}\n${lesson.student_name}`
            : `${lesson.teacher_name} - ${lesson.subject_name}\n${lesson.student_name}`,
          start: lesson.start_time,
          end: lesson.end_time,
          backgroundColor: isOwned ? '#38aad9' : '#6c757d',
          borderColor: isOwned ? '#2a8fc7' : '#5a6268',
          editable: isOwned,
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

      calendarApi.addEventSource(events)
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

// Get calendar API instance
const getCalendarApi = () => {
  if (calendarRef.value) {
    return calendarRef.value.getApi()
  }
  return null
}

// Handle event drag and drop
const handleTeacherEventDrop = (dropInfo: any) => {
  const event = dropInfo.event
  const lesson = lessons.value.find(l => String(l.id) === event.id)

  if (!lesson || lesson.teacher_id !== getCurrentUserId()) {
    dropInfo.revert()
    alert('You can only edit your own lessons')
    return
  }

  composableHandleEventDrop(
    event.id,
    event.title,
    dropInfo.oldEvent.startStr,
    dropInfo.oldEvent.endStr,
    event.startStr,
    event.endStr,
    lesson.is_recurring,
    lesson.teacher_id,
    lesson.student_id,
    lesson.subject_id,
    lesson.status,
  )

  dropInfo.revert()
}

// Handle calendar date selection for new lesson
const handleDateSelect = (info: any) => {
  composableHandleDateSelect(
    formatForDateTimeInput(info.startStr),
    formatForDateTimeInput(info.endStr),
  )
}

// Handle event click to edit or view lesson
const handleTeacherEventClick = (clickInfo: any) => {
  const event = clickInfo.event
  const lesson = lessons.value.find(l => String(l.id) === event.id)

  if (!lesson) return

  const isOwned = lesson.teacher_id === getCurrentUserId()

  if (isOwned) {
    composableHandleEventClick(lesson, isOwned)
  } else {
    // Show view-only info for other teachers' lessons
    alert(
      `${lesson.teacher_name}'s lesson: ${lesson.subject_name}\nStudent: ${lesson.student_name}`,
    )
  }
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
    fetchTeacherLessons(info.start, info.end)
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
  () => newLesson.value?.start,
  (newStartTime) => {
    if (newStartTime && newLesson.value) {
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
        <div v-if="connectionStore.loading" class="loading">
          <p>Loading students...</p>
        </div>

        <div v-else-if="students.length === 0" class="no-students">
          <div class="empty-state">
            <h3>No Students Connected Yet</h3>
            <p>
              You currently don't have any connected students. Contact your admin to establish student connections.
            </p>
          </div>
        </div>

        <div v-else class="students-list">
          <h2>Connected Students ({{ students.length }})</h2>
          <div class="students-grid">
            <div v-for="student in students" :key="student.id" class="student-card">
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
        <!-- Calendar -->
        <div class="calendar-container">
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
        </div>

        <!-- New Lesson Modal (Create Mode) -->
        <LessonFormModal
          :is-open="showLessonModal"
          :is-edit-mode="false"
          :lesson="newLesson"
          :teachers="[]"
          :students="students"
          :subjects="subjects"
          @submit="createLesson"
          @close="closeModal"
        />

        <!-- Edit Lesson Modal -->
        <LessonFormModal
          v-if="selectedLesson"
          :is-open="showEditModal"
          :is-edit-mode="true"
          :lesson="selectedLesson"
          :teachers="[]"
          :students="students"
          :subjects="subjects"
          @submit="updateLesson"
          @close="closeEditModal"
        />

        <!-- Move Confirmation Modal -->
        <ConfirmMoveModal
          :is-open="showMoveConfirmModal"
          :move-info="movedEventInfo"
          @confirm="confirmEventMove"
          @close="closeMoveConfirmModal"
        />

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
