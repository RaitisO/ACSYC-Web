<script setup lang="ts">
interface TimeSlot {
  time: string
  hour: number
  minute: number
  type: 'lesson' | 'break'
}
import { ref, computed, onMounted } from 'vue'
import type { Lesson, CalendarDay } from '@/types/calendar'
import { useRouter } from 'vue-router'
import TomSelect from '@/components/TomSelect.vue'

// Add to currentView type
const currentView = ref<'main' | 'users' | 'lessons' | 'settings'>('main')
const router = useRouter()
// Calendar state
const currentWeek = ref(new Date())
const lessons = ref<Lesson[]>([]) // Will be populated from backend

// Fetch dropdown data with error handling
const fetchDropdownData = async () => {
  try {
    console.log('Fetching dropdown data...')
    const response = await fetch('http://localhost:8080/api/dropdown-data', {
      credentials: 'include',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dropdown data fetch failed:', response.status, errorText)
      return
    }

    const data = await response.json()
    console.log('Dropdown data received:', data)

    students.value = data.students || []
    teachers.value = data.teachers || []
    subjects.value = data.subjects || []
  } catch (error) {
    console.error('Failed to fetch dropdown data:', error)
  }
}

const checkAuth = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/health', {
      credentials: 'include',
    })

    if (!response.ok) {
      router.push('/login')
      return false
    }
    return true
  } catch (error) {
    console.error('Auth check failed:', error)
    router.push('/login')
    return false
  }
}

// Fetch lessons with error handling
const fetchLessons = async () => {
  try {
    const startOfWeek = new Date(currentWeek.value)
    const currentDay = startOfWeek.getDay()
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)

    const startDateStr = startOfWeek.toISOString().split('T')[0]
    const endDateStr = endOfWeek.toISOString().split('T')[0]

    console.log('Fetching lessons from', startDateStr, 'to', endDateStr)

    const response = await fetch(
      `http://localhost:8080/api/lessons?start_date=${startDateStr}&end_date=${endDateStr}`,
      {
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lessons fetch failed:', response.status, errorText)
      return
    }

    const data = await response.json()
    console.log('Lessons data received:', data)
    lessons.value = data.lessons || []

    // Debug: Check what dates we actually have
    console.log('=== ALL LESSONS DEBUG ===')
    lessons.value.forEach((lesson) => {
      const lessonDate = new Date(lesson.start_time)
      console.log(`Lesson ${lesson.id}:`, {
        storedTime: lesson.start_time,
        date: lessonDate.toDateString(),
        hours: lessonDate.getHours(),
        minutes: lessonDate.getMinutes(),
        teacher: lesson.teacher_name,
        student: lesson.student_name,
      })
    })
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
  }
}

// FIXED: Get all lessons for a specific day
const getLessonsForDay = (day: Date) => {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)

  return lessons.value.filter((lesson) => {
    const lessonDate = new Date(lesson.start_time)

    // Simple date string comparison to avoid timezone issues
    const lessonDateStr = lessonDate.toDateString()
    const dayDateStr = day.toDateString()

    return lessonDateStr === dayDateStr
  })
}

// FIXED: Get lessons that match exact time slots
const getLessonsForTimeSlot = (day: Date, slot: TimeSlot) => {
  if (slot.type !== 'lesson') return []

  const dayLessons = getLessonsForDay(day)

  return dayLessons.filter((lesson) => {
    const lessonDate = new Date(lesson.start_time)
    return lessonDate.getHours() === slot.hour && lessonDate.getMinutes() === slot.minute
  })
}

// Generate time slots from 8:00 AM to 23:45
const timeSlots = computed(() => {
  const slots = []
  let hour = 8
  let minute = 0
  let lessonCount = 0

  while (hour < 24) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      hour,
      minute,
      type: 'lesson' as const,
    })

    lessonCount++

    if (lessonCount === 2) {
      let breakHour = hour
      let breakMinute = minute + 60

      if (breakMinute >= 60) {
        breakHour += Math.floor(breakMinute / 60)
        breakMinute = breakMinute % 60
      }

      if (breakHour < 24) {
        slots.push({
          time: `${breakHour.toString().padStart(2, '0')}:${breakMinute.toString().padStart(2, '0')}`,
          hour: breakHour,
          minute: breakMinute,
          type: 'break' as const,
        })

        hour = breakHour
        minute = breakMinute + 15

        if (minute >= 60) {
          hour += Math.floor(minute / 60)
          minute = minute % 60
        }
      } else {
        hour = breakHour
        minute = breakMinute
      }

      lessonCount = 0
    } else {
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    if (hour >= 24) break
  }

  return slots
})

// Generate week days (Monday to Sunday)
const weekDays = computed(() => {
  const startOfWeek = new Date(currentWeek.value)
  const currentDay = startOfWeek.getDay()
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
  startOfWeek.setDate(startOfWeek.getDate() - daysToMonday)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    return date
  })
})

// Navigation functions
const previousWeek = () => {
  const newDate = new Date(currentWeek.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeek.value = newDate
  fetchLessons()
}

const nextWeek = () => {
  const newDate = new Date(currentWeek.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeek.value = newDate
  fetchLessons()
}

const goToToday = () => {
  currentWeek.value = new Date()
  fetchLessons()
}

// Formatting functions
const formatDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

const isToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const formatWeekRange = (date: Date) => {
  const startOfWeek = new Date(date)
  const currentDay = startOfWeek.getDay()
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
  startOfWeek.setDate(startOfWeek.getDate() - daysToMonday)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
}

// Navigation functions
const showUsers = () => (currentView.value = 'users')
const showLessons = () => (currentView.value = 'lessons')
const showSettings = () => (currentView.value = 'settings')
const goBack = () => (currentView.value = 'main')

// Lesson creation state
const showLessonModal = ref(false)
const selectedSlot = ref<{ day: Date; slot: TimeSlot } | null>(null)
const newLesson = ref({
  date: '',
  time: '',
  student: '',
  teacher: '',
  subject: '',
  isRecurring: false,
  customTime: false,
})

const students = ref<{ id: number; first_name: string; last_name: string }[]>([])
const teachers = ref<{ id: number; first_name: string; last_name: string }[]>([])
const subjects = ref<{ id: number; name: string }[]>([])

const studentOptions = computed(() => {
  return students.value.map((student) => ({
    value: `${student.first_name} ${student.last_name}`,
    text: `${student.first_name} ${student.last_name}`,
  }))
})

const teacherOptions = computed(() => {
  return teachers.value.map((teacher) => ({
    value: `${teacher.first_name} ${teacher.last_name}`,
    text: `${teacher.first_name} ${teacher.last_name}`,
  }))
})

const subjectOptions = computed(() => {
  return subjects.value.map((subject) => ({
    value: subject.name,
    text: subject.name,
  }))
})

// Open lesson creation modal
const openLessonModal = (day: Date, slot: TimeSlot) => {
  if (slot.type === 'break') return

  selectedSlot.value = { day, slot }
  newLesson.value = {
    date: day.toISOString().split('T')[0],
    time: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`,
    student: '',
    teacher: '',
    subject: '',
    isRecurring: false,
    customTime: false,
  }
  showLessonModal.value = true
}

// Close modal
const closeLessonModal = () => {
  showLessonModal.value = false
  selectedSlot.value = null
  newLesson.value = {
    date: '',
    time: '',
    student: '',
    teacher: '',
    subject: '',
    isRecurring: false,
    customTime: false,
  }
}

// Get available time slots for dropdown
const availableTimeSlots = computed(() => {
  return timeSlots.value
    .filter((slot) => slot.type === 'lesson')
    .map((slot) => ({
      value: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`,
      label: `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')} - ${getEndTime(slot)}`,
    }))
})

// Calculate end time for display
const getEndTime = (slot: TimeSlot) => {
  let endHour = slot.hour
  let endMinute = slot.minute + 60

  if (endMinute >= 60) {
    endHour += Math.floor(endMinute / 60)
    endMinute = endMinute % 60
  }

  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
}

// Format date for display
const formatModalDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Calculate end date for recurring lessons
const getEndDate = () => {
  const today = new Date()
  const month = today.getMonth()
  if (month >= 5 && month <= 7) {
    return `August 31, ${today.getFullYear()}`
  } else {
    return `May 31, ${today.getFullYear() + 1}`
  }
}

// Form validation
const isFormValid = computed(() => {
  return (
    newLesson.value.student &&
    newLesson.value.teacher &&
    newLesson.value.subject &&
    newLesson.value.time
  )
})

// Create lesson function
const createLesson = async () => {
  try {
    if (!selectedSlot.value) return

    const startDateTime = new Date(selectedSlot.value.day)
    const [hours, minutes] = newLesson.value.time.split(':')
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const endDateTime = new Date(startDateTime)
    endDateTime.setHours(endDateTime.getHours() + 1)

    const selectedStudent = students.value.find(
      (s) => `${s.first_name} ${s.last_name}` === newLesson.value.student,
    )
    const selectedTeacher = teachers.value.find(
      (t) => `${t.first_name} ${t.last_name}` === newLesson.value.teacher,
    )
    const selectedSubject = subjects.value.find((s) => s.name === newLesson.value.subject)

    if (!selectedStudent || !selectedTeacher || !selectedSubject) {
      alert('Please select valid student, teacher, and subject')
      return
    }

    const formatTimeForGo = (date: Date): string => {
      const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      const year = utcDate.getUTCFullYear()
      const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(utcDate.getUTCDate()).padStart(2, '0')
      const hour = String(utcDate.getUTCHours()).padStart(2, '0')
      const minute = String(utcDate.getUTCMinutes()).padStart(2, '0')
      const second = String(utcDate.getUTCSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`
    }

    const lessonData = {
      teacher_id: Number(selectedTeacher.id),
      student_id: Number(selectedStudent.id),
      subject_id: Number(selectedSubject.id),
      start_time: formatTimeForGo(startDateTime),
      end_time: formatTimeForGo(endDateTime),
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

    if (response.ok) {
      await fetchLessons()
      closeLessonModal()
    } else {
      const error = await response.json()
      console.error('Backend error:', error)
      alert(error.error || 'Failed to create lesson')
    }
  } catch (error) {
    console.error('Failed to create lesson:', error)
    alert('Failed to create lesson: ' + (error as Error).message)
  }
}

// Initialize data
onMounted(async () => {
  const isAuthenticated = await checkAuth()
  if (isAuthenticated) {
    await fetchDropdownData()
    await fetchLessons()
  }
})
</script>

<template>
  <div class="admin-dashboard">
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
        <div class="calendar-controls">
          <button @click="previousWeek" class="calendar-btn">← Previous</button>
          <button @click="goToToday" class="calendar-btn today-btn">Today</button>
          <button @click="nextWeek" class="calendar-btn">Next →</button>
          <span class="week-display">{{ formatWeekRange(currentWeek) }}</span>
        </div>
      </div>

      <div class="calendar-container">
        <div class="calendar-header">
          <div class="time-column">Time</div>
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="day-header"
            :class="{ 'today-header': isToday(day) }"
          >
            <div class="day-name">{{ formatDayName(day) }}</div>
            <div class="date-number">{{ day.getDate() }}</div>
          </div>
        </div>

        <div class="calendar-body">
          <div class="time-slots">
            <div
              v-for="slot in timeSlots"
              :key="slot.time"
              class="time-slot"
              :class="{ 'break-slot': slot.type === 'break' }"
            >
              {{ slot.time }}
              <span v-if="slot.type === 'break'" class="break-label">Break</span>
            </div>
          </div>

          <div class="days-grid">
            <div
              v-for="day in weekDays"
              :key="day.toISOString()"
              class="day-column"
              :class="{ 'today-column': isToday(day) }"
            >
              <div
                v-for="slot in timeSlots"
                :key="slot.time"
                class="time-cell"
                :class="{
                  'break-cell': slot.type === 'break',
                  'clickable-slot': slot.type === 'lesson',
                }"
                @click="slot.type === 'lesson' ? openLessonModal(day, slot) : null"
              >
                <div v-if="slot.type === 'break'" class="break-block">15 min Break</div>

                <!-- SIMPLIFIED: Show lessons in their time slots -->
                <div
                  v-else
                  v-for="lesson in getLessonsForTimeSlot(day, slot)"
                  :key="lesson.id"
                  class="lesson-block"
                  :class="lesson.status"
                >
                  <div class="lesson-title">{{ lesson.subject_name }}</div>
                  <div class="lesson-details">
                    {{ lesson.teacher_name }} → {{ lesson.student_name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lesson Creation Modal -->
          <div v-if="showLessonModal" class="modal-overlay" @click="closeLessonModal">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h2>Create New Lesson</h2>
                <button @click="closeLessonModal" class="close-btn">&times;</button>
              </div>

              <div class="modal-body">
                <div class="modal-date">
                  <strong>Date:</strong> {{ selectedSlot ? formatModalDate(selectedSlot.day) : '' }}
                </div>

                <div class="form-group">
                  <label>Lesson Time:</label>
                  <select
                    v-model="newLesson.time"
                    class="form-select"
                    :disabled="!newLesson.customTime"
                  >
                    <option
                      v-for="timeSlot in availableTimeSlots"
                      :key="timeSlot.value"
                      :value="timeSlot.value"
                    >
                      {{ timeSlot.label }}
                    </option>
                  </select>

                  <label class="checkbox-label">
                    <input type="checkbox" v-model="newLesson.customTime" class="checkbox" />
                    <span>Use custom time (allows breaks and overlaps)</span>
                  </label>

                  <div v-if="newLesson.customTime" class="custom-time">
                    <input
                      type="time"
                      v-model="newLesson.time"
                      class="form-select"
                      :min="'08:00'"
                      :max="'23:45'"
                    />
                    <small class="help-text">Special cases only</small>
                  </div>
                </div>

                <div class="form-group">
                  <label>Student:</label>
                  <TomSelect
                    id="student-select"
                    :options="studentOptions"
                    v-model="newLesson.student"
                    placeholder="Search for a student..."
                  />
                </div>

                <div class="form-group">
                  <label>Teacher:</label>
                  <TomSelect
                    id="teacher-select"
                    :options="teacherOptions"
                    v-model="newLesson.teacher"
                    placeholder="Search for a teacher..."
                  />
                </div>

                <div class="form-group">
                  <label>Subject:</label>
                  <TomSelect
                    id="subject-select"
                    :options="subjectOptions"
                    v-model="newLesson.subject"
                    placeholder="Search for a subject..."
                  />
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="newLesson.isRecurring" class="checkbox" />
                    <span>Recurring lesson (weekly until end of term)</span>
                  </label>
                  <small class="help-text">
                    {{
                      newLesson.isRecurring
                        ? 'This lesson will repeat every week until ' + getEndDate()
                        : 'One-time lesson only'
                    }}
                  </small>
                </div>
              </div>

              <div class="modal-footer">
                <button @click="closeLessonModal" class="btn btn-cancel">Cancel</button>
                <button @click="createLesson" class="btn btn-primary" :disabled="!isFormValid">
                  Create Lesson
                </button>
              </div>
            </div>
          </div>
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
/* Your existing CSS styles remain exactly the same */
.admin-dashboard {
  padding: 2rem;
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

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.calendar-btn {
  background: #38aad9;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.today-btn {
  background: #9bbf19;
}

.week-display {
  font-weight: bold;
  color: #6c0f5f;
}

.calendar-container {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.time-column {
  padding: 1rem;
  font-weight: bold;
}

.day-header {
  padding: 1rem;
  text-align: center;
  border-left: 1px solid #e0e0e0;
}

.day-name {
  font-size: 0.9rem;
  color: #666;
}

.date-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.calendar-body {
  display: grid;
  grid-template-columns: 80px 1fr;
  max-height: 70vh;
  overflow-y: auto;
}

.time-slots {
  border-right: 1px solid #e0e0e0;
}

.time-slot {
  height: 60px;
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.8rem;
  color: #666;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-column {
  border-left: 1px solid #e0e0e0;
}

.time-cell {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.lesson-block {
  position: absolute;
  left: 2px;
  right: 2px;
  background: #38aad9;
  color: white;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow: hidden;
}

.lesson-block.scheduled {
  background: #38aad9;
}
.lesson-block.completed {
  background: #9bbf19;
}
.lesson-block.cancelled {
  background: #bf1ba9;
}

.lesson-title {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-details {
  font-size: 0.7rem;
  opacity: 0.9;
}

.break-slot {
  background: #fff9d8;
  color: gray;
  font-weight: bold;
}

.break-cell {
  background: #fff9d8;
}

.break-block {
  background: gray;
  color: white;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-align: center;
  font-weight: bold;
}

.break-label {
  font-size: 0.7rem;
  margin-left: 0.5rem;
  background: gray;
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.today-column {
  background: rgba(255, 249, 216, 0.3) !important;
  position: relative;
}

.today-column::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #f2d422;
}

.today-header {
  background: #f2d422 !important;
  color: #6c0f5f !important;
}

.today-header .day-name,
.today-header .date-number {
  color: #6c0f5f !important;
  font-weight: bold;
}

.day-header {
  position: relative;
  transition: all 0.3s ease;
}

.time-cell {
  position: relative;
}

.clickable-slot {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-slot:hover {
  background: rgba(56, 170, 217, 0.1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-bottom: 1px solid #e0e0e0;
  background: #6c0f5f;
  color: white;
  border-radius: 15px 15px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.modal-body {
  padding: 1.5rem;
}

.modal-date {
  background: #fff9d8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #6c0f5f;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #f2d422;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox {
  width: 1.2rem;
  height: 1.2rem;
}

.custom-time {
  margin-top: 0.5rem;
}

.help-text {
  display: block;
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #38aad9;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2a8fc7;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
