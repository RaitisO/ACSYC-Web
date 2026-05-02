<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ProfileSection from '@/components/sections/ProfileSection.vue'
import '../../styles/views/dashboards.css'

defineOptions({
  name: 'ParentDashboard',
})

// View state
const currentView = ref<'main' | 'children' | 'lessons' | 'progress' | 'profile'>('main')

// Children state - fetched from parent_child_relationship
const children = ref<any[]>([])
const isLoadingChildren = ref(false)

// Fetch children from parent_child_relationship
const fetchChildren = async () => {
  isLoadingChildren.value = true
  try {
    const response = await fetch(
      'http://localhost:8080/api/parents/children',
      {
        credentials: 'include',
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch children')
    }

    const data = await response.json()
    children.value = data.children || []
  } catch (error) {
    console.error('Error fetching children:', error)
    children.value = []
  } finally {
    isLoadingChildren.value = false
  }
}

// Navigation functions
const showChildren = async () => {
  currentView.value = 'children'
  await fetchChildren()
}
const showLessons = () => (currentView.value = 'lessons')
const showProgress = () => (currentView.value = 'progress')
const showProfile = () => (currentView.value = 'profile')
const goBack = () => (currentView.value = 'main')

// Fetch on mount
onMounted(async () => {
  await fetchChildren()
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
        <div v-if="isLoadingChildren" class="loading">
          <p>Loading children...</p>
        </div>

        <div v-else-if="children.length === 0" class="no-children">
          <div class="empty-state">
            <h3>No Children Connected Yet</h3>
            <p>
              You haven't connected with any children yet. Please contact your administrator to set up connections.
            </p>
          </div>
        </div>

        <div v-else>
          <!-- Children Section -->
          <div class="children-section">
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
