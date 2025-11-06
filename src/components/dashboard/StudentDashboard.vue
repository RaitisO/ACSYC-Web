<script setup lang="ts">
import { ref } from 'vue'
import ConnectionsSection from '@/components/ConnectionsSection.vue'
import ProfileSection from '@/components/ProfileSection.vue'

defineOptions({
  name: 'StudentDashboard',
})

const currentView = ref<'main' | 'lessons' | 'teachers' | 'progress' | 'connections' | 'profile'>(
  'main',
)

// Navigation functions
const showLessons = () => (currentView.value = 'lessons')
const showTeachers = () => (currentView.value = 'teachers')
const showProgress = () => (currentView.value = 'progress')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')
</script>

<template>
  <div class="student-dashboard">
    <!-- Main Dashboard View -->
    <div v-if="currentView === 'main'">
      <h1>Student Portal</h1>
      <div class="student-grid">
        <button class="student-card" @click="showLessons">
          <h3>My Lessons</h3>
          <p>View your upcoming lessons</p>
        </button>
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
    </div>

    <!-- Lessons View -->
    <div v-else-if="currentView === 'lessons'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Lessons</h1>
      </div>
      <div class="section-content">
        <p>Lessons content coming soon...</p>
      </div>
    </div>

    <!-- Teachers View -->
    <div v-else-if="currentView === 'teachers'" class="section-view">
      <div class="section-header">
        <button @click="goBack" class="back-btn">← Back to Dashboard</button>
        <h1>My Teachers</h1>
      </div>
      <div class="section-content">
        <p>Teachers content coming soon...</p>
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
.student-dashboard {
  padding: 2rem;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.student-card {
  background: #ff9a1f;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.student-card:hover {
  background: #e88a1a;
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.student-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.student-card p {
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
</style>
