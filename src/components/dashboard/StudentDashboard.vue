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

<style scoped></style>
