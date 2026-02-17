<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useLessons, useAuth } from '@/composables'
import { useLessonStore, useConnectionStore } from '@/stores'
import ConnectionsSection from '@/components/sections/ConnectionsSection.vue'
import ProfileSection from '@/components/sections/ProfileSection.vue'
import '../../styles/views/dashboards.css'
import type { StudentMiroBoard } from '@/types/calendar'

defineOptions({
  name: 'StudentDashboard',
})

// Stores
const lessonStore = useLessonStore()
const connectionStore = useConnectionStore()

// View state
const currentView = ref<'main' | 'teachers' | 'progress' | 'connections' | 'profile'>('main')

// Composable: lessons utility functions (formatDateTime, etc.)
const { formatDateTime } = useLessons()

// Composable: auth (for user ID)
const { getCurrentUserId } = useAuth()

// Computed: upcoming lessons from store
const upcomingLessons = computed(() =>
  lessonStore.lessons.slice(0, 5), // Show 5 upcoming
)

// Computed: teachers from connectionStore
const teachers = computed(() =>
  connectionStore.connections.filter((c) => c.role === 'teacher'),
)

// Miro boards state
const studentMiroBoards = ref<StudentMiroBoard[]>([])
const isLoadingBoards = ref(false)

// Navigation functions
const showTeachers = async () => {
  currentView.value = 'teachers'
  await connectionStore.fetchConnections()
}
const showProgress = () => (currentView.value = 'progress')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch student's Miro boards
const fetchStudentMiroBoards = async () => {
  isLoadingBoards.value = true
  try {
    const studentId = getCurrentUserId()
    if (!studentId) {
      throw new Error('User data not found')
    }

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

onMounted(async () => {
  await lessonStore.fetchLessons()
  await connectionStore.fetchConnections()
  await fetchStudentMiroBoards()
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

        <div v-if="lessonStore.loading" class="loading">Loading lessons...</div>

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
        <div v-if="connectionStore.loading" class="loading">
          <p>Loading teachers...</p>
        </div>

        <div v-else-if="teachers.length === 0" class="no-teachers">
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
          <h2>Connected Teachers ({{ teachers.length }})</h2>
          <div class="teachers-grid">
            <div v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
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
