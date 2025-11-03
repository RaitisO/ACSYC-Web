<script setup lang="ts">
interface TimeSlot {
  time: string
  hour: number
  minute: number
}
import { ref, computed, onMounted } from 'vue'
import type { Lesson, CalendarDay } from '@/types/calendar'
import TomSelect from '@/components/TomSelect.vue'

// Add to currentView type
const currentView = ref<'main' | 'users' | 'lessons' | 'settings'>('main')

// Calendar state
const currentWeek = ref(new Date())
const lessons = ref<Lesson[]>([]) // Will be populated from backend
// Fetch dropdown data with error handling
const fetchDropdownData = async () => {
  try {
    console.log('Fetching dropdown data...')
    const response = await fetch('http://localhost:8080/api/dropdown-data')

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
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lessons fetch failed:', response.status, errorText)
      return
    }

    const data = await response.json()
    console.log('Lessons data received:', data)
    lessons.value = data.lessons || []
  } catch (error) {
    console.error('Failed to fetch lessons:', error)
  }
}
// Update getLessonsForTimeSlot to use real data
const getLessonsForTimeSlot = (day: Date, slot: TimeSlot) => {
  return lessons.value.filter((lesson) => {
    const lessonDate = new Date(lesson.start_time)
    return (
      lessonDate.getDate() === day.getDate() &&
      lessonDate.getMonth() === day.getMonth() &&
      lessonDate.getFullYear() === day.getFullYear() &&
      lessonDate.getHours() === slot.hour &&
      lessonDate.getMinutes() === slot.minute
    )
  })
}
// Generate time slots from 8:00 AM to 23:45 with your schedule system
const timeSlots = computed(() => {
  const slots = []
  let hour = 8
  let minute = 0
  let lessonCount = 0 // Track consecutive lessons

  while (hour < 24) {
    // Add lesson time slot
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      hour,
      minute,
      type: 'lesson' as const,
    })

    lessonCount++

    // Check if we need a break (after every 2 lessons)
    if (lessonCount === 2) {
      // Calculate break time
      let breakHour = hour
      let breakMinute = minute + 60 // Lesson duration is 60 minutes

      // Handle minute overflow
      if (breakMinute >= 60) {
        breakHour += Math.floor(breakMinute / 60)
        breakMinute = breakMinute % 60
      }

      // Add break slot if it's still within the day
      if (breakHour < 24) {
        slots.push({
          time: `${breakHour.toString().padStart(2, '0')}:${breakMinute.toString().padStart(2, '0')}`,
          hour: breakHour,
          minute: breakMinute,
          type: 'break' as const,
        })

        // Move to next lesson after break (15 minutes later)
        hour = breakHour
        minute = breakMinute + 15

        // Handle minute overflow after break
        if (minute >= 60) {
          hour += Math.floor(minute / 60)
          minute = minute % 60
        }
      } else {
        // If break would go past midnight, just move to next day logic
        hour = breakHour
        minute = breakMinute
      }

      lessonCount = 0 // Reset lesson counter
    } else {
      // Move to next lesson (normal progression)
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    // Safety check to prevent infinite loops
    if (hour >= 24) break
  }

  return slots
})

// Generate week days (Monday to Sunday)
const weekDays = computed(() => {
  const startOfWeek = new Date(currentWeek.value)
  const currentDay = startOfWeek.getDay()

  // Calculate how many days to subtract to get to Monday
  // Monday is day 1 in JavaScript (0=Sunday, 1=Monday, ..., 6=Saturday)
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
// Check if a date is today
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
  endOfWeek.setDate(endOfWeek.getDate() + 6) // Sunday is 6 days after Monday

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
  if (slot.type === 'break') return // Don't allow creating lessons during breaks

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
}

// Get available time slots for dropdown (only lesson slots)
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
  const month = today.getMonth() // 0-11 (Jan-Dec)

  // If between June and August (summer), end August 31st
  if (month >= 5 && month <= 7) {
    return `August 31, ${today.getFullYear()}`
  }
  // Otherwise school year, end May 31st of next year
  else {
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

// Create lesson function (frontend only for now)
const createLesson = async () => {
  try {
    if (!selectedSlot.value) return

    const startDateTime = new Date(selectedSlot.value.day)
    const [hours, minutes] = newLesson.value.time.split(':')
    startDateTime.setHours(parseInt(hours), parseInt(minutes))

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

    const lessonData = {
      teacher_id: selectedTeacher.id,
      student_id: selectedStudent.id,
      subject_id: selectedSubject.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_recurring: newLesson.value.isRecurring,
    }

    const response = await fetch('http://localhost:8080/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    })

    if (response.ok) {
      await fetchLessons() // Refresh the calendar
      closeLessonModal()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to create lesson')
    }
  } catch (error) {
    console.error('Failed to create lesson:', error)
    alert('Failed to create lesson')
  }
}

// Initialize data
onMounted(async () => {
  await fetchDropdownData()
  await fetchLessons()
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
        <!-- Add user tables, edit forms, etc here -->
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

          <!-- In the days grid -->
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

                <!-- Lessons only show in lesson slots -->
                <div
                  v-else
                  v-for="lesson in getLessonsForTimeSlot(day, slot)"
                  :key="lesson.id"
                  class="lesson-block"
                  :class="lesson.status"
                >
                  <div class="lesson-title">{{ lesson.title }}</div>
                  <div class="lesson-details">{{ lesson.teacher }} → {{ lesson.student }}</div>
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
                <!-- Date Display -->
                <div class="modal-date">
                  <strong>Date:</strong> {{ selectedSlot ? formatModalDate(selectedSlot.day) : '' }}
                </div>

                <!-- Time Selection -->
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

                <!-- Student Selection -->
                <div class="form-group">
                  <label>Student:</label>
                  <TomSelect
                    id="student-select"
                    :options="studentOptions"
                    v-model="newLesson.student"
                    :placeholder="'Search for a student...'"
                  />
                </div>

                <!-- Teacher Selection -->
                <div class="form-group">
                  <label>Teacher:</label>
                  <TomSelect
                    id="teacher-select"
                    :options="teacherOptions"
                    v-model="newLesson.teacher"
                    :placeholder="'Search for a teacher...'"
                  />
                </div>

                <!-- Subject Selection -->
                <div class="form-group">
                  <label>Subject:</label>
                  <TomSelect
                    id="subject-select"
                    :options="subjectOptions"
                    v-model="newLesson.subject"
                    :placeholder="'Search for a subject...'"
                  />
                </div>
                <!-- Recurring Option -->
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
        <!-- Add configuration options here -->
      </div>
    </div>
  </div>
</template>

<style scoped>
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
/* Today column highlight */
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

/* Today header highlight */
.today-header {
  background: #f2d422 !important;
  color: #6c0f5f !important;
}

.today-header .day-name,
.today-header .date-number {
  color: #6c0f5f !important;
  font-weight: bold;
}

/* Ensure the highlight works with existing styles */
.day-header {
  position: relative;
  transition: all 0.3s ease;
}

.time-cell {
  position: relative;
}
/* Clickable slots */
.clickable-slot {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-slot:hover {
  background: rgba(56, 170, 217, 0.1);
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
