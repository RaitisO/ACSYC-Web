<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ConnectionsSection from '@/components/ConnectionsSection.vue'
import ProfileSection from '@/components/ProfileSection.vue'
import type { StudentMiroBoard } from '@/types/calendar'

interface UpcomingLesson {
  id: number
  teacher_name: string
  subject_name: string
  start_time: string
  end_time: string
  status: string
}

defineOptions({
  name: 'StudentDashboard',
})

const currentView = ref<'main' | 'teachers' | 'progress' | 'connections' | 'profile'>('main')

const upcomingLessons = ref<UpcomingLesson[]>([])
const isLoadingLessons = ref(false)
const studentMiroBoards = ref<StudentMiroBoard[]>([])
const isLoadingBoards = ref(false)
const connectedTeachers = ref<any[]>([])
const isLoadingTeachers = ref(false)

// Navigation functions
const showTeachers = () => {
  currentView.value = 'teachers'
  fetchConnectedTeachers()
}
const showProgress = () => (currentView.value = 'progress')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Format date and time for display
const formatDateTime = (isoString: string): { date: string; time: string } => {
  const date = new Date(isoString)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return { date: dateStr, time: timeStr }
}

// Fetch upcoming lessons for the student
const fetchUpcomingLessons = async () => {
  isLoadingLessons.value = true
  try {
    // Get today's date and next 30 days
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const endDate = futureDate.toISOString().split('T')[0]

    const response = await fetch(
      `http://localhost:8080/api/lessons?start_date=${startDate}&end_date=${endDate}`,
      {
        credentials: 'include',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch lessons')
    }

    const data = await response.json()
    // Get only upcoming lessons (next 5) sorted by start time
    upcomingLessons.value = (data.lessons || [])
      .sort(
        (a: UpcomingLesson, b: UpcomingLesson) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
      .slice(0, 5)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    upcomingLessons.value = []
  } finally {
    isLoadingLessons.value = false
  }
}

// Fetch student's Miro boards
const fetchStudentMiroBoards = async () => {
  isLoadingBoards.value = true
  try {
    // Get student ID from localStorage user object
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      throw new Error('User data not found')
    }

    const user = JSON.parse(storedUser)
    const studentId = user.id

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
  } finally {
    isLoadingBoards.value = false
  }
}

// Fetch connected teachers
const fetchConnectedTeachers = async () => {
  isLoadingTeachers.value = true
  try {
    const response = await fetch('http://localhost:8080/api/connected-users', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch connected teachers')

    const data = await response.json()
    // Filter to only show teachers
    connectedTeachers.value = data.connected_users.filter((user: any) => user.role === 'teacher')
  } catch (error) {
    console.error('Error fetching connected teachers:', error)
    connectedTeachers.value = []
  } finally {
    isLoadingTeachers.value = false
  }
}

onMounted(() => {
  fetchUpcomingLessons()
  fetchStudentMiroBoards()
})
</script>

<template>
  <div class="student-dashboard">
    <!-- Main Dashboard View -->
    <div v-if="currentView === 'main'">
      <h1>Student Portal</h1>
      <div class="student-grid">
        <button class="student-card" @click="showTeachers">
          <h3>My Teachers</h3>
          <p>See all your teachers</p>
        </button>
        <button class="student-card" @click="showProgress">
          <h3>Progress</h3>
          <p>Track your learning progress</p>
        </button>
        <button class="student-card" @click="showConnections">
          <h3>Connections</h3>
          <p>Connect with teachers and parents</p>
        </button>
        <button class="student-card" @click="showProfile">
          <h3>My Profile</h3>
          <p>Manage your account information</p>
        </button>
      </div>

      <!-- Upcoming Lessons Section on Main Dashboard -->
      <div class="upcoming-lessons-section">
        <div class="lessons-header">
          <h2>Next 5 Upcoming Lessons</h2>
          <div class="lesson-actions">
            <!-- Dynamic Miro Boards -->
            <a
              v-for="board in studentMiroBoards"
              :key="board.id"
              :href="board.board_url"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn miro-btn"
            >
              {{ board.board_name }}
            </a>

            <!-- Fixed Zoom Button -->
            <a
              href="https://us06web.zoom.us/j/81527478663?pwd=PVjqkEwm3S31tfnQ4DqWUrYDJoLZpK.1"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn zoom-btn"
            >
              Zoom
            </a>
          </div>
        </div>

        <div v-if="isLoadingLessons" class="loading">Loading lessons...</div>

        <div v-else>
          <div v-if="upcomingLessons.length === 0" class="no-lessons">
            No upcoming lessons scheduled.
          </div>

          <ul v-else class="lessons-list">
            <li v-for="lesson in upcomingLessons" :key="lesson.id" class="lesson-item">
              <div class="lesson-datetime">
                <span class="lesson-date">{{ formatDateTime(lesson.start_time).date }}</span>
                <span class="dot">•</span>
                <span class="lesson-time">{{ formatDateTime(lesson.start_time).time }}</span>
              </div>
              <div class="lesson-meta">
                <span class="teacher"
                  >Teacher: <strong>{{ lesson.teacher_name }}</strong></span
                >
                <span class="subject"
                  >Subject: <strong>{{ lesson.subject_name }}</strong></span
                >
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Teachers View -->
    <div v-else-if="currentView === 'teachers'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Teachers</h1>
      </div>
      <div class="section-content">
        <div v-if="isLoadingTeachers" class="loading">
          <p>Loading teachers...</p>
        </div>

        <div v-else-if="connectedTeachers.length === 0" class="no-teachers">
          <div class="empty-state">
            <h3>No Teachers Connected Yet</h3>
            <p>
              You haven't connected with any teachers yet. Use the Connections section to connect
              with your teachers.
            </p>
            <button @click="showConnections" class="btn-primary">Go to Connections</button>
          </div>
        </div>

        <div v-else class="teachers-list">
          <h2>Connected Teachers ({{ connectedTeachers.length }})</h2>
          <div class="teachers-grid">
            <div v-for="teacher in connectedTeachers" :key="teacher.id" class="teacher-card">
              <div class="teacher-avatar">
                {{ teacher.first_name.charAt(0) }}{{ teacher.last_name.charAt(0) }}
              </div>
              <div class="teacher-info">
                <h3>{{ teacher.first_name }} {{ teacher.last_name }}</h3>
                <p class="teacher-email">{{ teacher.email }}</p>
                <p class="connection-date">
                  Connected: {{ new Date(teacher.connected_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress View -->
    <div v-else-if="currentView === 'progress'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Progress</h1>
      </div>
      <div class="section-content">
        <p>Progress tracking coming soon...</p>
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
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.student-card {
  background: #ff9a1f;
  border: 2px solid #ff9a1f;
  border-radius: 10px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}
.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(242, 212, 34, 0.3);
}
.student-card h3 {
  margin: 0 0 0.5rem 0;
  color: #fff9d8;
}
.student-card p {
  margin: 0;
  color: #fff9d8;
  font-size: 0.9rem;
}
.upcoming-lessons-section {
  background: #fff9d8;
  border: 1px solid #e8d89f;
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1rem;
}
.lessons-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}
.upcoming-lessons-section h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #2b2b2b;
}
.lesson-actions {
  display: flex;
  gap: 0.5rem;
}
.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: inline-block;
  text-decoration: none;
  text-align: center;
}
.miro-btn {
  background: #ffd500;
  color: #000;
}
.miro-btn:hover {
  background: #ffb700;
  transform: translateY(-2px);
}
.zoom-btn {
  background: #2d8cff;
  color: #fff;
}
.zoom-btn:hover {
  background: #0b5cff;
  transform: translateY(-2px);
}
.loading {
  color: #666;
}
.no-lessons {
  color: #666;
  padding: 0.5rem 0;
}
.lessons-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}
.lesson-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem;
  border-radius: 8px;
  background: #fffdf0;
  border: 1px solid #f0e0a0;
  margin-bottom: 0.5rem;
}
.lesson-datetime {
  font-size: 0.95rem;
  color: #333;
}
.lesson-datetime .dot {
  margin: 0 0.4rem;
  color: #999;
}
.lesson-meta {
  font-size: 0.9rem;
  color: #444;
  display: flex;
  gap: 1rem;
}
.lesson-meta .teacher,
.lesson-meta .subject {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.teacher-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #ffc107;
}

.teacher-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffc107, #ff9800);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.teacher-info {
  flex: 1;
}

.teacher-info h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
}

.teacher-email {
  color: #666;
  font-size: 14px;
  margin: 0 0 4px 0;
}

.connection-date {
  color: #999;
  font-size: 12px;
  margin: 0;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.no-teachers {
  text-align: center;
  padding: 40px 20px;
}

.empty-state {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 30px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
}
</style>
