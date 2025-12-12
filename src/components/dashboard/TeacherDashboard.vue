<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ConnectionsSection from '@/components/ConnectionsSection.vue'
import ProfileSection from '@/components/ProfileSection.vue'

defineOptions({
  name: 'TeacherDashboard',
})

const currentView = ref<'main' | 'students' | 'calendar' | 'subjects' | 'connections' | 'profile'>(
  'main',
)
const connectedStudents = ref<any[]>([])
const isLoading = ref(false)

// Calendar state
const calendarRef = ref<any>(null)
const calendarEvents = ref<any[]>([])
const showLessonModal = ref(false)
const newLesson = ref({
  teacher: '',
  student: '',
  subject: '',
  start: '',
  end: '',
  isRecurring: false,
})
const selectedTimeSlot = ref<any>(null)
const lessonMessage = ref('')
const isCreatingLesson = ref(false)

// Get current user from localStorage
const getCurrentUserId = (): number | null => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  const user = JSON.parse(storedUser)
  return user.id
}

// Navigation functions
const showStudents = () => {
  currentView.value = 'students'
  fetchConnectedUsers()
}
const showCalendar = () => {
  currentView.value = 'calendar'
  fetchTeacherLessons()
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

    const data = await response.json()
    // Filter to only show students for teachers
    connectedStudents.value = data.connected_users.filter((user: any) => user.role === 'student')
  } catch (error) {
    console.error('Error fetching connected users:', error)
    connectedStudents.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch teacher's lessons and their connected students' lessons
const fetchTeacherLessons = async () => {
  try {
    const teacherId = getCurrentUserId()
    if (!teacherId) return

    // Fetch all lessons - we'll filter on the frontend
    const response = await fetch('http://localhost:8080/api/lessons', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch lessons')

    const data = await response.json()
    const allLessons = data.lessons || []

    // Filter lessons:
    // 1. Lessons taught by this teacher
    // 2. Lessons for students connected to this teacher (to avoid double booking)
    const teacherLessons = allLessons.filter((lesson: any) => {
      const isTeacherLesson = lesson.teacher_id === teacherId
      const isStudentConnectedLesson = connectedStudents.value.some(
        (student) => student.id === lesson.student_id,
      )
      return isTeacherLesson || isStudentConnectedLesson
    })

    // Convert to calendar events
    calendarEvents.value = teacherLessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.teacher_id === teacherId ? lesson.subject_name : `${lesson.teacher_name} - ${lesson.subject_name}`,
      start: lesson.start_time,
      end: lesson.end_time,
      backgroundColor: lesson.teacher_id === teacherId ? '#38aad9' : '#6c757d',
      borderColor: lesson.teacher_id === teacherId ? '#2a8fc7' : '#5a6268',
      extendedProps: {
        teacherId: lesson.teacher_id,
        studentId: lesson.student_id,
        subjectId: lesson.subject_id,
        teacherName: lesson.teacher_name,
        studentName: lesson.student_name,
        isOwned: lesson.teacher_id === teacherId,
      },
    }))
  } catch (error) {
    console.error('Error fetching teacher lessons:', error)
  }
}

// Handle calendar date selection
const handleDateSelect = (info: any) => {
  selectedTimeSlot.value = {
    start: info.startStr,
    end: info.endStr,
  }
  newLesson.value.start = info.startStr.replace('Z', '')
  newLesson.value.end = info.endStr.replace('Z', '')
  newLesson.value.teacher = String(getCurrentUserId())
  showLessonModal.value = true
}

// Create lesson
const createLesson = async () => {
  if (!newLesson.value.student || !newLesson.value.subject || !newLesson.value.start || !newLesson.value.end) {
    lessonMessage.value = 'Please fill in all fields'
    return
  }

  isCreatingLesson.value = true
  lessonMessage.value = ''

  try {
    const response = await fetch('http://localhost:8080/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        teacher_id: newLesson.value.teacher,
        student_id: newLesson.value.student,
        subject_id: newLesson.value.subject,
        start_time: newLesson.value.start,
        end_time: newLesson.value.end,
        is_recurring: newLesson.value.isRecurring,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create lesson')
    }

    lessonMessage.value = 'Lesson created successfully!'
    resetLessonForm()
    showLessonModal.value = false
    await fetchTeacherLessons()

    setTimeout(() => {
      lessonMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('Error creating lesson:', error)
    lessonMessage.value = `Error: ${error.message}`
  } finally {
    isCreatingLesson.value = false
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

// Close modal
const closeModal = () => {
  showLessonModal.value = false
  resetLessonForm()
}

onMounted(() => {
  fetchConnectedUsers()
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
                <p class="connection-date">
                  Connected: {{ new Date(student.connected_at).toLocaleDateString() }}
                </p>
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
              <div v-if="selectedTimeSlot" class="time-selection">
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
                    <option v-for="student in connectedStudents" :key="student.id" :value="student.id">
                      {{ student.first_name }} {{ student.last_name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="subject">Select Subject:</label>
                  <select id="subject" v-model="newLesson.subject" class="form-select" required>
                    <option value="">Choose a subject...</option>
                    <option value="math">Mathematics</option>
                    <option value="english">English</option>
                    <option value="science">Science</option>
                    <option value="history">History</option>
                    <option value="art">Art</option>
                    <option value="pe">Physical Education</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input v-model="newLesson.isRecurring" type="checkbox" class="checkbox-input" />
                    <span class="checkmark"></span>
                    Recurring Lesson (weekly at same time)
                  </label>
                </div>

                <div v-if="lessonMessage" class="message" :class="{ error: lessonMessage.includes('Error') }">
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
          <FullCalendar
            ref="calendarRef"
            :options="{
              plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
              initialView: 'timeGridWeek',
              headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              },
              events: calendarEvents,
              selectable: true,
              select: handleDateSelect,
              height: 'auto',
              contentHeight: '70vh',
              eventDisplay: 'block',
              allDaySlot: true,
              slotDuration: '00:30:00',
              slotLabelInterval: '00:30:00',
              slotLabelFormat: {
                meridiem: 'short',
                hour: 'numeric',
                minute: '2-digit',
              },
              eventTimeFormat: {
                meridiem: 'short',
                hour: 'numeric',
                minute: '2-digit',
              },
            }"
          />
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
  height: 70vh;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
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
</style>

<style>
/* FullCalendar custom styling */
:deep(.fc) {
  height: 100%;
  font-family: inherit;
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
