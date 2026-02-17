<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { applicationService } from '@/services'
import '../../styles/views/admin.css'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  role: string
  application_status: string
  created_at: string
}

interface ApplicationGroup {
  primary_member_id: string
  primary_member_name: string
  application_date: string
  members: User[]
}

const applications = ref<ApplicationGroup[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const expandedApplications = ref<Set<string>>(new Set())
const processingIds = ref<Set<string>>(new Set())

onMounted(async () => {
  await fetchApplications()
})

const fetchApplications = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await applicationService.getApplications()
    applications.value = response.applications || []
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    errorMessage.value = error.message || 'Failed to load applications'
  } finally {
    isLoading.value = false
  }
}

const toggleExpanded = (studentId: string) => {
  if (expandedApplications.value.has(studentId)) {
    expandedApplications.value.delete(studentId)
  } else {
    expandedApplications.value.add(studentId)
  }
}

const approveApplication = async (studentId: string) => {
  if (!confirm('Are you sure you want to approve this application?')) {
    return
  }

  processingIds.value.add(studentId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.approveApplication(studentId)
    successMessage.value = 'Application approved successfully!'

    // Remove from list
    const index = applications.value.findIndex((app) => app.primary_member_id === studentId)
    if (index !== -1) {
      applications.value.splice(index, 1)
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error approving application:', error)
    errorMessage.value = error.message || 'Failed to approve application'
  } finally {
    processingIds.value.delete(studentId)
  }
}

const rejectApplication = async (studentId: string) => {
  if (!confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
    return
  }

  processingIds.value.add(studentId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.rejectApplication(studentId)
    successMessage.value = 'Application rejected successfully!'

    // Remove from list
    const index = applications.value.findIndex((app) => app.primary_member_id === studentId)
    if (index !== -1) {
      applications.value.splice(index, 1)
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error rejecting application:', error)
    errorMessage.value = error.message || 'Failed to reject application'
  } finally {
    processingIds.value.delete(studentId)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'student':
      return 'badge-student'
    case 'parent':
      return 'badge-parent'
    default:
      return 'badge-default'
  }
}
</script>

<template>
  <div class="admin-applications-container">
    <div class="header">
      <h1>Pending Student Applications</h1>
      <p class="subtitle">Review and approve family registrations</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="message error-message">
      {{ errorMessage }}
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="message success-message">
      {{ successMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      <p>Loading pending applications...</p>
    </div>

    <!-- No Applications -->
    <div v-else-if="applications.length === 0" class="no-applications">
      <p>No pending applications at this time.</p>
    </div>

    <!-- Applications List -->
    <div v-else class="applications-list">
      <div v-for="app in applications" :key="app.primary_member_id" class="application-card">
        <!-- Application Header -->
        <div class="application-header">
          <div class="student-info">
            <h2>{{ app.primary_member_name }}</h2>
            <p class="submission-date">Submitted: {{ formatDate(app.application_date) }} at {{ formatTime(app.application_date) }}</p>
            <p v-if="app.members.length > 1" class="family-info">
              {{ app.members.length }} family members registered
            </p>
          </div>

          <div class="actions">
            <button
              @click="toggleExpanded(app.primary_member_id)"
              class="expand-btn"
              :class="{ expanded: expandedApplications.has(app.primary_member_id) }"
            >
              {{ expandedApplications.has(app.primary_member_id) ? '▼' : '▶' }} Details
            </button>
          </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="expandedApplications.has(app.primary_member_id)" class="application-details">
          <!-- Student Section -->
          <div class="members-section">
            <h3>Student Information</h3>
            <div v-for="member in app.members.filter((m) => m.role === 'student')" :key="member.id" class="member-card">
              <div class="member-header">
                <div class="member-name">
                  {{ member.first_name }} {{ member.last_name }}
                  <span :class="['member-role', getRoleBadgeClass(member.role)]">{{ member.role }}</span>
                </div>
              </div>
              <div class="member-details">
                <p><strong>Email:</strong> {{ member.email }}</p>
                <p><strong>Phone:</strong> {{ member.phone }}</p>
                <p><strong>Date of Birth:</strong> {{ formatDate(member.date_of_birth) }}</p>
              </div>
            </div>
          </div>

          <!-- Parents Section -->
          <div v-if="app.members.filter((m) => m.role === 'parent').length > 0" class="members-section">
            <h3>Parent(s) Information</h3>
            <div v-for="member in app.members.filter((m) => m.role === 'parent')" :key="member.id" class="member-card">
              <div class="member-header">
                <div class="member-name">
                  {{ member.first_name }} {{ member.last_name }}
                  <span :class="['member-role', getRoleBadgeClass(member.role)]">{{ member.role }}</span>
                </div>
              </div>
              <div class="member-details">
                <p><strong>Email:</strong> {{ member.email }}</p>
                <p><strong>Phone:</strong> {{ member.phone }}</p>
                <p><strong>Date of Birth:</strong> {{ formatDate(member.date_of_birth) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="application-actions">
          <button
            @click="approveApplication(app.primary_member_id)"
            class="approve-btn"
            :disabled="processingIds.has(app.primary_member_id)"
          >
            {{ processingIds.has(app.primary_member_id) ? '⏳' : '✓' }} Approve
          </button>
          <button
            @click="rejectApplication(app.primary_member_id)"
            class="reject-btn"
            :disabled="processingIds.has(app.primary_member_id)"
          >
            {{ processingIds.has(app.primary_member_id) ? '⏳' : '✕' }} Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
