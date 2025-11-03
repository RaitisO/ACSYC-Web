<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref({
  first_name: '',
  last_name: '',
  email: '',
  role: '',
})

const logout = async () => {
  try {
    await fetch('http://localhost:8080/api/logout', {
      method: 'POST',
      //credentials: 'include', Important for sessions
    })

    localStorage.removeItem('user')
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
import AdminDashboard from '@/components/dashboard/AdminDashboard.vue'
import TeacherDashboard from '@/components/dashboard/TeacherDashboard.vue'
import StudentDashboard from '@/components/dashboard/StudentDashboard.vue'
import ParentDashboard from '@/components/dashboard/ParentDashboard.vue'
onMounted(() => {
  // Get user data from localStorage (set during login)
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  } else {
    // Redirect to login if no user data
    router.push('/login')
  }
})
</script>

<template>
  <div class="dashboard">
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
</template>

<style scoped>
.dashboard-nav {
  background: #fff9d8;
  border-bottom: 2px solid #f2d422;
  padding: 1rem 0;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-content h2 {
  color: #6c0f5f;
  margin: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-role {
  color: #42993c;
  font-weight: bold;
  text-transform: capitalize;
}

.logout-btn {
  background: #bf1ba9;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #9bbf19;
  transform: translateY(-2px);
}

.dashboard-main {
  padding: 2rem;
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #38aad9 0%, #42993c 100%);
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.user-info {
  background: #fff9d8;
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1.5rem 0;
}

.user-info p {
  margin: 0.5rem 0;
  color: #6c0f5f;
}

.dashboard-content {
  text-align: center;
  color: #666;
}
</style>
