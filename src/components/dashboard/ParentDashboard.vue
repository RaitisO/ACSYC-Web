<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ConnectionsSection from '@/components/ConnectionsSection.vue'
import ProfileSection from '@/components/ProfileSection.vue'
defineOptions({
  name: 'ParentDashboard',
})

const currentView = ref<'main' | 'children' | 'lessons' | 'progress' | 'connections' | 'profile'>(
  'main',
)
const connectedChildren = ref<any[]>([])
const connectedTeachers = ref<any[]>([])
const isLoading = ref(false)

// Navigation functions
const showChildren = () => {
  currentView.value = 'children'
  fetchConnectedUsers()
}
const showLessons = () => (currentView.value = 'lessons')
const showProgress = () => (currentView.value = 'progress')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch connected users
const fetchConnectedUsers = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:8080/api/connected-users', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch connected users')

    const data = await response.json()
    // Filter to show children (students) and teachers
    connectedChildren.value = data.connected_users.filter((user: any) => user.role === 'student')
    connectedTeachers.value = data.connected_users.filter((user: any) => user.role === 'teacher')
  } catch (error) {
    console.error('Error fetching connected users:', error)
    connectedChildren.value = []
    connectedTeachers.value = []
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="parent-dashboard">
    <!-- Main Dashboard View -->
    <div v-if="currentView === 'main'">
      <h1>Parent Dashboard</h1>
      <div class="parent-grid">
        <button class="parent-card" @click="showChildren">
          <h3>My Children</h3>
          <p>View your children's profiles</p>
        </button>
        <button class="parent-card" @click="showLessons">
          <h3>Lesson Schedule</h3>
          <p>See your children's lessons</p>
        </button>
        <button class="parent-card" @click="showProgress">
          <h3>Progress Reports</h3>
          <p>Monitor learning progress</p>
        </button>
        <button class="parent-card" @click="showConnections">
          <h3>Connections</h3>
          <p>Connect with your children</p>
        </button>
        <button class="parent-card" @click="showProfile">
          <h3>My Profile</h3>
          <p>Manage your account information</p>
        </button>
      </div>
    </div>

    <!-- Children View -->
    <div v-else-if="currentView === 'children'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Children</h1>
      </div>
      <div class="section-content">
        <!-- Children content remains the same -->
        <div v-if="isLoading" class="loading">
          <p>Loading...</p>
        </div>

        <div
          v-else-if="connectedChildren.length === 0 && connectedTeachers.length === 0"
          class="no-connections"
        >
          <div class="empty-state">
            <h3>No Connections Yet</h3>
            <p>
              You haven't connected with any children or teachers yet. Use the Connections section
              to get started.
            </p>
            <button @click="showConnections" class="btn-primary">Go to Connections</button>
          </div>
        </div>

        <div v-else>
          <!-- Children Section -->
          <div v-if="connectedChildren.length > 0" class="children-section">
            <h2>My Children ({{ connectedChildren.length }})</h2>
            <div class="children-grid">
              <div v-for="child in connectedChildren" :key="child.id" class="child-card">
                <div class="child-avatar">
                  {{ child.first_name.charAt(0) }}{{ child.last_name.charAt(0) }}
                </div>
                <div class="child-info">
                  <h3>{{ child.first_name }} {{ child.last_name }}</h3>
                  <p class="child-email">{{ child.email }}</p>
                  <p class="connection-date">
                    Connected: {{ new Date(child.connected_at).toLocaleDateString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Teachers Section -->
          <div v-if="connectedTeachers.length > 0" class="teachers-section">
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
    </div>

    <!-- Lessons View -->
    <div v-else-if="currentView === 'lessons'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>Lesson Schedule</h1>
      </div>
      <div class="section-content">
        <p>Lesson schedule content coming soon...</p>
      </div>
    </div>

    <!-- Progress View -->
    <div v-else-if="currentView === 'progress'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>Progress Reports</h1>
      </div>
      <div class="section-content">
        <p>Progress tracking content coming soon...</p>
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
.parent-dashboard {
  padding: 2rem;
}

.parent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.parent-card {
  background: #9bbf19;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.parent-card:hover {
  background: #87a916;
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.parent-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.parent-card p {
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

/* Children and Teachers List Styles */
.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-connections {
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
  background: #9bbf19;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #87a916;
  transform: translateY(-2px);
}

.children-section,
.teachers-section {
  margin-bottom: 2rem;
}

.children-section h2,
.teachers-section h2 {
  color: #6c0f5f;
  margin-bottom: 1.5rem;
}

.children-grid,
.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.child-card,
.teacher-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.child-card {
  border-left: 4px solid #9bbf19;
}

.teacher-card {
  border-left: 4px solid #38aad9;
}

.child-avatar,
.teacher-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
}

.child-avatar {
  background: #9bbf19;
}

.teacher-avatar {
  background: #38aad9;
}

.child-info h3,
.teacher-info h3 {
  margin: 0 0 0.5rem 0;
  color: #6c0f5f;
}

.child-email,
.teacher-email {
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
