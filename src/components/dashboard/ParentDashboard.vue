<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useConnectionStore } from '@/stores'
import ConnectionsSection from '@/components/sections/ConnectionsSection.vue'
import ProfileSection from '@/components/sections/ProfileSection.vue'
import '../../styles/views/dashboards.css'

defineOptions({
  name: 'ParentDashboard',
})

// Store
const connectionStore = useConnectionStore()

// View state
const currentView = ref<'main' | 'children' | 'lessons' | 'progress' | 'connections' | 'profile'>(
  'main',
)

// Computed: children connections filtered from store
const children = computed(() =>
  connectionStore.connections.filter((c) => c.role === 'student'),
)
const teachers = computed(() =>
  connectionStore.connections.filter((c) => c.role === 'teacher'),
)

// Navigation functions
const showChildren = async () => {
  currentView.value = 'children'
  await connectionStore.fetchConnections()
}
const showLessons = () => (currentView.value = 'lessons')
const showProgress = () => (currentView.value = 'progress')
const showConnections = () => (currentView.value = 'connections')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch on mount
onMounted(async () => {
  await connectionStore.fetchConnections()
})
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
        <div v-if="connectionStore.loading" class="loading">
          <p>Loading...</p>
        </div>

        <div
          v-else-if="children.length === 0 && teachers.length === 0"
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
          <div v-if="children.length > 0" class="children-section">
            <h2>My Children ({{ children.length }})</h2>
            <div class="children-grid">
              <div v-for="child in children" :key="child.id" class="child-card">
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
          <div v-if="teachers.length > 0" class="teachers-section">
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
