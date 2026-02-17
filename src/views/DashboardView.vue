<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiService from '@/services/api'
import { useUserStore } from '@/stores'
import './DashboardView.css'

const router = useRouter()
const userStore = useUserStore()
const isSessionValid = ref(false)
const isCheckingSession = ref(true)

// Get user from store (fallback to reactive ref for display)
const user = computed(() => userStore.currentUser || {
  first_name: '',
  last_name: '',
  email: '',
  role: '',
})

const logout = async () => {
  try {
    await apiService.post('/logout', {})
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear store and localStorage, then redirect
    userStore.logout()
    router.push('/')
  }
}

// Validate session with backend
const validateSession = async () => {
  isCheckingSession.value = true
  try {
    await apiService.get('/profile')

    // Session is valid
    isSessionValid.value = true
  } catch (error) {
    console.error('Session validation failed:', error)
    // Clear store and localStorage and redirect to login
    userStore.logout()
    isSessionValid.value = false
    router.push('/login')
  } finally {
    isCheckingSession.value = false
  }
}

import AdminDashboard from '@/components/dashboard/AdminDashboard.vue'
import TeacherDashboard from '@/components/dashboard/TeacherDashboard.vue'
import StudentDashboard from '@/components/dashboard/StudentDashboard.vue'
import ParentDashboard from '@/components/dashboard/ParentDashboard.vue'

onMounted(async () => {
  // Load user from storage (sets currentUser in store from localStorage)
  userStore.loadUserFromStorage()

  // Check if user exists
  if (!userStore.isAuthenticated) {
    isCheckingSession.value = false
    router.push('/login')
    return
  }

  // Validate session with backend
  await validateSession()
})
</script>

<template>
  <div class="dashboard">
    <!-- Loading state while checking session -->
    <div v-if="isCheckingSession" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Verifying session...</p>
    </div>

    <!-- Dashboard content (only shown if session is valid) -->
    <div v-else-if="isSessionValid" class="dashboard-content">
      <nav class="dashboard-nav">
        <div class="nav-content">
          <h2>Welcome, {{ user.first_name }} {{ user.last_name }}</h2>
          <div class="nav-actions">
            <span class="user-role">({{ user.role }})</span>
            <button @click="logout" class="logout-btn">Log Out</button>
          </div>
        </div>
      </nav>

      <main class="dashboard-main">
        <!-- Role-based component rendering -->
        <AdminDashboard v-if="user.role === 'admin'" />
        <TeacherDashboard v-else-if="user.role === 'teacher'" />
        <StudentDashboard v-else-if="user.role === 'student'" />
        <ParentDashboard v-else-if="user.role === 'parent'" />
        <div v-else>Unknown role</div>
      </main>
    </div>
  </div>
</template>
