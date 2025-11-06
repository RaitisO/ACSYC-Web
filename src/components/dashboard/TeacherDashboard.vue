<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// Navigation functions
const showStudents = () => {
  currentView.value = 'students'
  fetchConnectedUsers()
}
const showCalendar = () => (currentView.value = 'calendar')
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
        <p>Calendar content coming soon...</p>
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
</style>
