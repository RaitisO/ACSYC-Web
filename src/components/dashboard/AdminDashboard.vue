<script setup lang="ts">
import { ref, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

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
})

// Mock data for dropdowns - replace with actual data from your backend
const teachers = ref([
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Sarah Johnson' },
  { id: '3', name: 'Mike Davis' },
  { id: '4', name: 'Emily Wilson' },
])

const students = ref([
  { id: '1', name: 'Alex Thompson' },
  { id: '2', name: 'Maria Garcia' },
  { id: '3', name: 'David Brown' },
  { id: '4', name: 'Lisa Chen' },
])

const subjects = ref([
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Computer Science',
])

// Calendar configuration
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: [
    {
      id: '1',
      title: 'Mathematics - John Smith',
      start: '2025-11-06T10:00:00',
      end: '2025-11-06T11:00:00',
    },
    {
      id: '2',
      title: 'Physics - Sarah Johnson',
      start: '2024-01-16T14:00:00',
      end: '2024-01-16T15:00:00',
    },
    {
      id: '3',
      title: 'Chemistry - Mike Davis',
      start: '2025-11-06T11:00:00',
      end: '2025-11-06T12:00:00',
    },
  ],
  slotMinTime: '08:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:15:00',
  slotLabelInterval: '00:15:00',
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  firstDay: 1,
  allDaySlot: false,
  nowIndicator: true,
  editable: true,
  selectable: true, // This enables date selection
  selectMirror: true,
  weekends: true,
  dayHeaderFormat: { weekday: 'short', day: 'numeric' },
  // Add these to ensure selection works properly
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
})

// Navigation functions
const showUsers = () => (currentView.value = 'users')
const showLessons = () => (currentView.value = 'lessons')
const showSettings = () => (currentView.value = 'settings')
const goBack = () => (currentView.value = 'main')

// Calendar event handlers
function handleDateSelect(selectInfo: any) {
  console.log('Selected date:', selectInfo)

  // Set the selected time slot
  selectedTimeSlot.value = selectInfo
  newLesson.value.start = selectInfo.startStr
  newLesson.value.end = selectInfo.endStr

  // Open the modal
  showLessonModal.value = true

  // Unselect the date range after selection
  selectInfo.view.calendar.unselect()
}

function handleEventClick(clickInfo: any) {
  console.log('Event clicked:', clickInfo)
  // You can open an edit modal here
}

function handleEventDrop(dropInfo: any) {
  console.log('Event moved:', dropInfo)
  // Update the lesson in your backend here
}

// Lesson creation functions
const createLesson = () => {
  console.log('Creating lesson:', newLesson.value)

  // Here you would typically send the data to your backend
  // For now, we'll just log it and close the modal

  // Reset the form
  resetLessonForm()
  showLessonModal.value = false

  // You can add the event to the calendar here
  // calendarOptions.value.events.push({
  //   id: Date.now().toString(),
  //   title: `${newLesson.value.subject} - ${teachers.value.find(t => t.id === newLesson.value.teacher)?.name}`,
  //   start: newLesson.value.start,
  //   end: newLesson.value.end
  // })
}

const resetLessonForm = () => {
  newLesson.value = {
    teacher: '',
    student: '',
    subject: '',
    start: '',
    end: '',
  }
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
          <div class="time-display">
            <strong>Selected Time:</strong>
            <span>{{ formatSelectedTime }}</span>
          </div>

          <!-- Lesson Form -->
          <form @submit.prevent="createLesson" class="lesson-form">
            <div class="form-group">
              <label for="teacher">Teacher:</label>
              <select id="teacher" v-model="newLesson.teacher" required class="form-select">
                <option value="">Select a teacher</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="student">Student:</label>
              <select id="student" v-model="newLesson.student" required class="form-select">
                <option value="">Select a student</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="subject">Subject:</label>
              <select id="subject" v-model="newLesson.subject" required class="form-select">
                <option value="">Select a subject</option>
                <option v-for="subject in subjects" :key="subject" :value="subject">
                  {{ subject }}
                </option>
              </select>
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
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #38aad9;
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
}

:deep(.fc-event:hover) {
  background: #2a8fc7;
}

/* Selection styling */
:deep(.fc-highlight) {
  background: rgba(56, 170, 217, 0.2) !important;
}
</style>
