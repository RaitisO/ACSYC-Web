<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

// ========== STATE ==========
// Three separate arrays for application categories
const pendingApplications = ref<StudentApplication[]>([])
const approvedApplications = ref<StudentApplication[]>([])
const rejectedApplications = ref<StudentApplication[]>([])

// UI state
const isLoading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const processingIds = ref<Set<string>>(new Set())

// Modal state
const selectedApplication = ref<StudentApplication | null>(null)
const modalContext = ref<'pending' | 'approved' | 'rejected'>('pending')

// Section expand/collapse state
const expandedSections = ref({
  pending: true,    // Pending always expanded by default
  approved: false,   // Approved collapsed by default
  rejected: false    // Rejected collapsed by default
})

// Dialog state for bulk delete confirmation
const bulkDeleteConfirmation = ref({
  isOpen: false,
  status: '',
  count: 0
})

// ========== LIFECYCLE ==========
onMounted(async () => {
  await fetchApplications()
})

// ========== COMPUTED PROPERTIES ==========
// Count totals for section headers
const pendingCount = computed(() => pendingApplications.value.length)
const approvedCount = computed(() => approvedApplications.value.length)
const rejectedCount = computed(() => rejectedApplications.value.length)
const totalCount = computed(() => pendingCount.value + approvedCount.value + rejectedCount.value)


// ========== MAIN FUNCTIONS ==========
const fetchApplications = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await applicationService.getApplications()
    console.log('Applications response:', response)
    
    // Handle response structure
    let allApplications: StudentApplication[] = []
    if (Array.isArray(response)) {
      allApplications = response
    } else if (response && response.applications) {
      allApplications = response.applications
    } else if (response && Array.isArray(response.data)) {
      allApplications = response.data
    } else {
      console.warn('Unexpected response structure:', response)
      allApplications = []
    }
    
    // Categorize applications by status
    // Pending: 'submitted' or 'under_review'
    // Approved: 'approved'
    // Rejected: 'rejected'
    pendingApplications.value = allApplications.filter(
      app => app.status === 'submitted' || app.status === 'under_review'
    )
    approvedApplications.value = allApplications.filter(
      app => app.status === 'approved'
    )
    rejectedApplications.value = allApplications.filter(
      app => app.status === 'rejected'
    )
    
    console.log('Categorized applications:', {
      pending: pendingApplications.value.length,
      approved: approvedApplications.value.length,
      rejected: rejectedApplications.value.length,
      total: allApplications.length
    })
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    errorMessage.value = error.message || 'Failed to load applications'
  } finally {
    isLoading.value = false
  }
}

// ========== SECTION TOGGLE ==========
const toggleSection = (section: 'pending' | 'approved' | 'rejected') => {
  expandedSections.value[section] = !expandedSections.value[section]
  console.log(`Section '${section}' toggled to ${expandedSections.value[section] ? 'expanded' : 'collapsed'}`)
}

// ========== MODAL ACTIONS ==========
const openApplicationModal = (application: StudentApplication, context: 'pending' | 'approved' | 'rejected') => {
  selectedApplication.value = application
  modalContext.value = context
  console.log(`Opening modal for app ${application.id} in context: ${context}`)
}

const closeApplicationModal = () => {
  selectedApplication.value = null
  console.log('Closing application modal')
}

const handleApplicationApproved = () => {
  console.log('Application approved - refreshing list')
  closeApplicationModal()
  fetchApplications()
}

const handleApplicationRejected = () => {
  console.log('Application rejected - refreshing list')
  closeApplicationModal()
  fetchApplications()
}

// ========== APPROVED SECTION ACTIONS ==========
const resendActivationEmail = async (appId: string, appName: string) => {
  processingIds.value.add(appId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log(`Resending activation email for app ${appId}`)
    await applicationService.resendActivationEmail(appId)
    successMessage.value = `Activation email resent to ${appName}!`
    console.log(`✓ Activation email resent for ${appId}`)

    // Clear message after 4 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 4000)
  } catch (error: any) {
    console.error('Error resending activation email:', error)
    errorMessage.value = error.message || 'Failed to resend activation email'
  } finally {
    processingIds.value.delete(appId)
  }
}

const deleteApplication = async (appId: string, appName: string) => {
  const confirmed = confirm(`Are you sure you want to delete the application for ${appName}? This cannot be undone.`)
  if (!confirmed) return

  processingIds.value.add(appId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log(`Deleting application ${appId}`)
    await applicationService.deleteApplication(appId)
    successMessage.value = `Application for ${appName} deleted successfully!`
    console.log(`✓ Application deleted: ${appId}`)

    // Refresh applications list
    await fetchApplications()

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error deleting application:', error)
    errorMessage.value = error.message || 'Failed to delete application'
  } finally {
    processingIds.value.delete(appId)
  }
}

// ========== REJECTED SECTION ACTIONS ==========
const reApproveApplication = async (appId: string, appName: string) => {
  const confirmed = confirm(`Re-approve application for ${appName}? A new activation email will be sent.`)
  if (!confirmed) return

  processingIds.value.add(appId)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log(`Re-approving application ${appId}`)
    await applicationService.reApproveApplication(appId)
    successMessage.value = `Application for ${appName} re-approved! Activation email sent.`
    console.log(`✓ Application re-approved: ${appId}`)

    // Refresh applications list
    await fetchApplications()

    // Clear message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error re-approving application:', error)
    errorMessage.value = error.message || 'Failed to re-approve application'
  } finally {
    processingIds.value.delete(appId)
  }
}

// ========== BULK DELETE ACTIONS ==========
const openBulkDeleteConfirmation = (status: string, count: number) => {
  bulkDeleteConfirmation.value = {
    isOpen: true,
    status,
    count
  }
  console.log(`Opening bulk delete confirmation for status: ${status} (${count} records)`)
}

const closeBulkDeleteConfirmation = () => {
  bulkDeleteConfirmation.value = {
    isOpen: false,
    status: '',
    count: 0
  }
}

const confirmBulkDelete = async () => {
  const { status, count } = bulkDeleteConfirmation.value
  if (!status || count === 0) return

  const confirmed = confirm(
    `DELETE ALL ${count} ${status} APPLICATIONS?\n\nThis cannot be undone. Are you absolutely sure?`
  )
  if (!confirmed) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log(`Deleting all applications with status: ${status}`)
    const result = await applicationService.deleteAllApplicationsByStatus(status)
    successMessage.value = `${result.deleted} ${status} applications deleted successfully!`
    console.log(`✓ Bulk deleted ${result.deleted} applications with status: ${status}`)

    // Refresh applications list
    await fetchApplications()

    // Clear message after 4 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 4000)
  } catch (error: any) {
    console.error('Error bulk deleting applications:', error)
    errorMessage.value = error.message || 'Failed to delete applications'
  } finally {
    isLoading.value = false
    closeBulkDeleteConfirmation()
  }
}
// ========== DATE/TIME HELPERS ==========
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
</script>

<template>
  <div class="admin-applications-container">
    <!-- Header -->
    <div class="header">
      <h1>Student Applications Management</h1>
      <p class="subtitle">Review, manage, and track all applications across all statuses</p>
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
      <p>Loading applications...</p>
    </div>

    <!-- No Applications Message -->
    <div v-else-if="totalCount === 0" class="no-applications">
      <p>No applications at this time.</p>
    </div>

    <!-- Applications Sections -->
    <div v-else class="applications-sections">
      <!-- ===== PENDING SECTION ===== -->
      <div class="section-container">
        <div 
          class="section-header"
          @click="toggleSection('pending')"
          :class="{ expanded: expandedSections.pending }"
        >
          <button class="section-toggle">
            {{ expandedSections.pending ? '▼' : '▶' }}
          </button>
          <h2>Pending Applications ({{ pendingCount }})</h2>
        </div>

        <!-- Pending Applications Content -->
        <div v-if="expandedSections.pending" class="section-content">
          <div v-if="pendingCount === 0" class="no-items">
            <p>No pending applications.</p>
          </div>

          <div v-else class="applications-list">
            <div v-for="app in pendingApplications" :key="app.id" class="application-card">
              <!-- Card Header -->
              <div class="application-header">
                <div class="student-info">
                  <h3>{{ app.applicant_first_name }} {{ app.applicant_last_name }}</h3>
                  <p class="submission-date">
                    Submitted: {{ formatDate(app.created_at) }} at {{ formatTime(app.created_at) }}
                  </p>
                </div>
              </div>

              <!-- Pending Actions -->
              <div class="application-actions">
                <button
                  @click="openApplicationModal(app, 'pending')"
                  class="view-details-btn"
                  :disabled="processingIds.has(app.id)"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== APPROVED SECTION ===== -->
      <div class="section-container">
        <div 
          class="section-header"
          @click="toggleSection('approved')"
          :class="{ expanded: expandedSections.approved }"
        >
          <button class="section-toggle">
            {{ expandedSections.approved ? '▼' : '▶' }}
          </button>
          <h2>Approved Applications ({{ approvedCount }})</h2>
          <button 
            v-if="approvedCount > 0"
            @click.stop="openBulkDeleteConfirmation('approved', approvedCount)"
            class="bulk-delete-btn"
            title="Delete all approved applications"
          >
            Delete All
          </button>
        </div>

        <!-- Approved Applications Content -->
        <div v-if="expandedSections.approved" class="section-content">
          <div v-if="approvedCount === 0" class="no-items">
            <p>No approved applications.</p>
          </div>

          <div v-else class="applications-list">
            <div v-for="app in approvedApplications" :key="app.id" class="application-card">
              <!-- Card Header -->
              <div class="application-header">
                <div class="student-info">
                  <h3>{{ app.applicant_first_name }} {{ app.applicant_last_name }}</h3>
                  <p class="submission-date">
                    Approved: {{ formatDate(app.reviewed_at) }} at {{ formatTime(app.reviewed_at) }}
                  </p>
                </div>
              </div>

              <!-- Approved Actions -->
              <div class="application-actions">
                <button
                  @click="resendActivationEmail(app.id, `${app.applicant_first_name} ${app.applicant_last_name}`)"
                  class="resend-email-btn"
                  :disabled="processingIds.has(app.id)"
                >
                  {{ processingIds.has(app.id) ? 'Sending...' : 'Resend Email' }}
                </button>
                <button
                  @click="deleteApplication(app.id, `${app.applicant_first_name} ${app.applicant_last_name}`)"
                  class="delete-btn"
                  :disabled="processingIds.has(app.id)"
                >
                  {{ processingIds.has(app.id) ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== REJECTED SECTION ===== -->
      <div class="section-container">
        <div 
          class="section-header"
          @click="toggleSection('rejected')"
          :class="{ expanded: expandedSections.rejected }"
        >
          <button class="section-toggle">
            {{ expandedSections.rejected ? '▼' : '▶' }}
          </button>
          <h2>Rejected Applications ({{ rejectedCount }})</h2>
          <button 
            v-if="rejectedCount > 0"
            @click.stop="openBulkDeleteConfirmation('rejected', rejectedCount)"
            class="bulk-delete-btn"
            title="Delete all rejected applications"
          >
            Delete All
          </button>
        </div>

        <!-- Rejected Applications Content -->
        <div v-if="expandedSections.rejected" class="section-content">
          <div v-if="rejectedCount === 0" class="no-items">
            <p>No rejected applications.</p>
          </div>

          <div v-else class="applications-list">
            <div v-for="app in rejectedApplications" :key="app.id" class="application-card">
              <!-- Card Header -->
              <div class="application-header">
                <div class="student-info">
                  <h3>{{ app.applicant_first_name }} {{ app.applicant_last_name }}</h3>
                  <p class="submission-date">
                    Rejected: {{ formatDate(app.reviewed_at) }} at {{ formatTime(app.reviewed_at) }}
                  </p>
                </div>
              </div>

              <!-- Rejected Actions -->
              <div class="application-actions">
                <button
                  @click="reApproveApplication(app.id, `${app.applicant_first_name} ${app.applicant_last_name}`)"
                  class="re-approve-btn"
                  :disabled="processingIds.has(app.id)"
                >
                  {{ processingIds.has(app.id) ? 'Processing...' : 'Re-approve' }}
                </button>
                <button
                  @click="deleteApplication(app.id, `${app.applicant_first_name} ${app.applicant_last_name}`)"
                  class="delete-btn"
                  :disabled="processingIds.has(app.id)"
                >
                  {{ processingIds.has(app.id) ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Confirmation Dialog -->
    <div v-if="bulkDeleteConfirmation.isOpen" class="confirmation-overlay">
      <div class="confirmation-dialog">
        <h3>Confirm Bulk Delete</h3>
        <p>
          Are you absolutely sure you want to delete all {{ bulkDeleteConfirmation.count }} 
          <strong>{{ bulkDeleteConfirmation.status }}</strong> applications?
        </p>
        <p class="warning">This action cannot be undone!</p>
        <div class="dialog-actions">
          <button @click="closeBulkDeleteConfirmation" class="cancel-btn">
            Cancel
          </button>
          <button @click="confirmBulkDelete" class="confirm-delete-btn">
            Yes, Delete All
          </button>
        </div>
      </div>
    </div>

    <!-- Application Details Modal (For Pending Apps) -->
    <ApplicationDetailsModal
      :visible="selectedApplication !== null && modalContext === 'pending'"
      :application="selectedApplication"
      @close="closeApplicationModal"
      @approved="handleApplicationApproved"
      @rejected="handleApplicationRejected"
    />
  </div>
</template>
