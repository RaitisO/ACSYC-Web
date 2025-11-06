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
const selectedTimeSlot = ref<any>(null)
const newLesson = ref({
  teacher: '',
  student: '',
  subject: '',
  start: '',
  end: '',
  isRecurring: false,
})
const formatForDateTimeInput = (dateStr: string) => {
  const date = new Date(dateStr)
  // Use UTC methods to avoid timezone conversion
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
const calendarEvents = ref<any[]>([])

// Function to fetch lessons from backend
const fetchLessons = async (start: Date, end: Date) => {
  try {
    // Format dates for backend (YYYY-MM-DD)
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

    // Transform backend data to FullCalendar events
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
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: calendarEvents,
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
  // Add timezone configuration
  timeZone: 'local', // Display in local timezone
  eventTimeFormat: {
    // Ensure event times show correctly
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
})

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
  // Wait for the DOM to be updated
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

// Navigation functions
const showUsers = () => (currentView.value = 'users')
const showLessons = () => {
  currentView.value = 'lessons'
  fetchDropdownData()
}
const showSettings = () => (currentView.value = 'settings')
const goBack = () => (currentView.value = 'main')

// Calendar event handlers
function handleDateSelect(selectInfo: any) {
  console.log('Selected date (UTC):', selectInfo.startStr, selectInfo.endStr)

  selectedTimeSlot.value = selectInfo

  // Use the exact times from FullCalendar (already in correct timezone)
  newLesson.value.start = formatForDateTimeInput(selectInfo.startStr)
  newLesson.value.end = formatForDateTimeInput(selectInfo.endStr)

  console.log('Formatted times:', newLesson.value.start, newLesson.value.end)

  showLessonModal.value = true
  setTimeout(() => {
    initializeTomSelect()
  }, 100)

  selectInfo.view.calendar.unselect()
}

function handleEventClick(clickInfo: any) {
  console.log('Event clicked:', clickInfo)
}

function handleEventDrop(dropInfo: any) {
  console.log('Event moved:', dropInfo)
}

// Lesson creation functions
const createLesson = async () => {
  // Validate required fields
  if (!newLesson.value.teacher || !newLesson.value.student || !newLesson.value.subject) {
    alert('Please fill in all required fields')
    return
  }

  try {
    // Format the data for backend
    const startTimeFormatted = newLesson.value.start + ':00'
    const endTimeFormatted = newLesson.value.end + ':00'

    const lessonData = {
      teacher_id: parseInt(newLesson.value.teacher),
      student_id: parseInt(newLesson.value.student),
      subject_id: parseInt(newLesson.value.subject),
      start_time: startTimeFormatted, // Format: "2024-01-16T10:00:00"
      end_time: endTimeFormatted, // Format: "2024-01-16T11:00:00"
      is_recurring: newLesson.value.isRecurring,
    }

    console.log('Sending lesson data:', lessonData)

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

    // Show success message

    // Reset and close
    resetLessonForm()
    showLessonModal.value = false

    const calendarApi = selectedTimeSlot.value.view.calendar
    fetchLessons(calendarApi.view.activeStart, calendarApi.view.activeEnd)
    // You'll implement this in the next step
  } catch (error) {
    console.error('Error creating lesson:', error)
    alert(`Failed to create lesson: ${error.message}`)
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

// Format date for display
const formatSelectedTime = computed(() => {
  if (!selectedTimeSlot.value) return ''

  const start = new Date(selectedTimeSlot.value.startStr)
  const end = new Date(selectedTimeSlot.value.endStr)

  return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
})
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
          <FullCalendar :options="calendarOptions" />
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

.time-display {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #38aad9;
}

.time-display strong {
  color: #6c0f5f;
  display: block;
  margin-bottom: 0.5rem;
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
  gap: 1rem;
  justify-content: flex-end;
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

.btn-create:hover {
  background: #357c30;
  transform: translateY(-2px);
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
</style>
