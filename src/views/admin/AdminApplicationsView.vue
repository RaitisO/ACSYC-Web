<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { applicationService } from '@/services'
import ApplicationDetailsModal from '@/components/ApplicationDetailsModal.vue'
import '../../styles/views/admin.css'

interface StudentApplication {
  id: string
  applicant_email: string
  applicant_first_name: string
  applicant_last_name: string
  applicant_phone: string
  grade_level: string
  gymnasium_status: string
  learning_goals_json: string
  preferred_language: string
  teacher_preferences_json: string
  availability_json: string
  availability_description: string
  lessons_per_week: number
  group_lessons_json: string
  source_of_referral: string
  is_new_family: boolean
  existing_parent_email: string
  parent_email: string
  parent_phone: string
  parent_name: string
  desired_subjects: string
  status: string
  created_at: string
  reviewed_by: string
  reviewed_at: string
  [key: string]: any
}

const applications = ref<StudentApplication[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const processingIds = ref<Set<string>>(new Set())
const selectedApplication = ref<StudentApplication | null>(null)

onMounted(async () => {
  await fetchApplications()
})

const fetchApplications = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await applicationService.getApplications()
    console.log('Applications response:', response)
    
    // Handle both direct array and wrapped response
    if (Array.isArray(response)) {
      applications.value = response
    } else if (response && response.applications) {
      applications.value = response.applications
    } else if (response && Array.isArray(response.data)) {
      applications.value = response.data
    } else {
      console.warn('Unexpected response structure:', response)
      applications.value = []
    }
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    errorMessage.value = error.message || 'Failed to load applications'
  } finally {
    isLoading.value = false
  }
}

// Helper function to consolidate time slots with 60-minute gap tolerance
const consolidateTimeSlots = (availabilityJson: string): string => {
  if (!availabilityJson) return 'No availability data'
  
  try {
    const availability = JSON.parse(availabilityJson)
    if (!availability || typeof availability !== 'object') return 'No availability data'
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const result: string[] = []
    
    for (const day of days) {
      const daySlots = availability[day]
      if (!daySlots || !Array.isArray(daySlots) || daySlots.length === 0) continue
      
      // Parse and sort slots
      const parsed = daySlots.map(slot => {
        const [start, end] = slot.split('-')
        return {
          start: timeToMinutes(start),
          end: timeToMinutes(end),
          display: slot
        }
      }).sort((a, b) => a.start - b.start)
      
      // Consolidate slots with up to 60-minute gaps
      const consolidated: any[] = []
      for (const slot of parsed) {
        if (consolidated.length === 0) {
          consolidated.push(slot)
        } else {
          const lastSlot = consolidated[consolidated.length - 1]
          const gapMinutes = slot.start - lastSlot.end
          
          if (gapMinutes <= 60) {
            // Merge slots
            lastSlot.end = Math.max(lastSlot.end, slot.end)
          } else {
            // Keep as separate slot
            consolidated.push(slot)
          }
        }
      }
      
      // Format for display
      const displaySlots = consolidated.map(slot => 
        `${minutesToTime(slot.start)}-${minutesToTime(slot.end)}`
      ).join('; ')
      
      const dayName = day.charAt(0).toUpperCase() + day.slice(1)
      result.push(`${dayName}: ${displaySlots}`)
    }
    
    return result.length > 0 ? result.join(' | ') : 'No availability'
  } catch (error) {
    console.error('Error parsing availability:', error)
    return 'Invalid availability data'
  }
}

// Helper to convert HH:MM to minutes
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper to convert minutes back to HH:MM
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Helper to parse desired subjects
const parseSubjects = (subjectsData: string): string => {
  if (!subjectsData) return 'Not specified'
  
  try {
    // Try to parse as JSON array first
    if (subjectsData.startsWith('[')) {
      const subjects = JSON.parse(subjectsData)
      if (Array.isArray(subjects)) {
        return subjects.join(', ')
      }
    }
    // Otherwise return as-is
    return subjectsData
  } catch {
    return subjectsData
  }
}

const approveApplication = async (appId: string) => {
  if (!confirm('Are you sure you want to approve this application?')) {
    return
  }

  processingIds.value.add(appId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.approveApplication(appId)
    successMessage.value = 'Application approved successfully!'

    // Refresh list
    await fetchApplications()
    selectedApplication.value = null

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error approving application:', error)
    errorMessage.value = error.message || 'Failed to approve application'
  } finally {
    processingIds.value.delete(appId)
  }
}

const rejectApplication = async (appId: string) => {
  if (!confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
    return
  }

  processingIds.value.add(appId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.rejectApplication(appId)
    successMessage.value = 'Application rejected successfully!'

    // Refresh list
    await fetchApplications()
    selectedApplication.value = null

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error rejecting application:', error)
    errorMessage.value = error.message || 'Failed to reject application'
  } finally {
    processingIds.value.delete(appId)
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

const openApplicationModal = (application: StudentApplication) => {
  selectedApplication.value = application
}

const closeApplicationModal = () => {
  selectedApplication.value = null
}

const handleApplicationApproved = () => {
  closeApplicationModal()
  // Refresh applications list
  fetchApplications()
}

const handleApplicationRejected = () => {
  closeApplicationModal()
  // Refresh applications list
  fetchApplications()
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
      <div v-for="app in applications" :key="app.id" class="application-card">
        <!-- Application Header -->
        <div class="application-header">
          <div class="student-info">
            <h2>{{ app.applicant_first_name }} {{ app.applicant_last_name }}</h2>
            <p class="submission-date">Submitted: {{ formatDate(app.created_at) }} at {{ formatTime(app.created_at) }}</p>
          </div>
        </div>

        <!-- Action Button -->
        <div class="application-actions">
          <button
            @click="openApplicationModal(app)"
            class="view-details-btn"
          >
            View Details
          </button>
        </div>
      </div>
    </div>

    <!-- Application Details Modal -->
    <ApplicationDetailsModal
      :visible="selectedApplication !== null"
      :application="selectedApplication"
      @close="closeApplicationModal"
      @approved="handleApplicationApproved"
      @rejected="handleApplicationRejected"
    />
  </div>
</template>
