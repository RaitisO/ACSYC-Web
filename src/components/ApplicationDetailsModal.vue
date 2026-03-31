<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { applicationService } from '@/services'
import { consolidateTimeSlots, parseSubjects, parseJsonField, formatTeacherPreferences } from '@/utils/applicationHelpers'
import { useRegistrationOptions } from '@/composables/useRegistrationOptions'

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

interface Props {
  visible: boolean
  application: StudentApplication | null
}

interface Emits {
  (e: 'close'): void
  (e: 'approved'): void
  (e: 'rejected'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Initialize registration options for looking up learning goals, subjects, etc.
const { fetchOptions, getNamesByIds } = useRegistrationOptions()
const optionsLoaded = ref(false)

const tryParseArray = (data: any): number[] => {
  try {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : [parsed]
    }
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

onMounted(async () => {
  await fetchOptions()
  optionsLoaded.value = true
})

// Ensure options are loaded when an application is provided
watch(() => props.application, async (newApp) => {
  if (newApp && !optionsLoaded.value) {
    await fetchOptions()
    optionsLoaded.value = true
  }
})

// Log when props change to debug data flow
import { watch } from 'vue'
watch(() => props.application, (newApp) => {
  console.log('[ApplicationDetailsModal] Application prop changed:', newApp)
  if (newApp) {
    console.log('[ApplicationDetailsModal] - applicant_first_name:', newApp.applicant_first_name)
    console.log('[ApplicationDetailsModal] - applicant_last_name:', newApp.applicant_last_name)
    console.log('[ApplicationDetailsModal] - parent_name:', newApp.parent_name)
    console.log('[ApplicationDetailsModal] - parent_email:', newApp.parent_email)
    console.log('[ApplicationDetailsModal] - parent_phone:', newApp.parent_phone)
    console.log('[ApplicationDetailsModal] - availability_json:', newApp.availability_json)
    console.log('[ApplicationDetailsModal] - availability_description:', newApp.availability_description)
    console.log('[ApplicationDetailsModal] - desired_subjects:', newApp.desired_subjects)
    console.log('[ApplicationDetailsModal] - learning_goals_json:', newApp.learning_goals_json)
    console.log('[ApplicationDetailsModal] - teacher_preferences_json:', newApp.teacher_preferences_json)
  }
})

// State management
const isProcessing = ref(false)
const actionType = ref<'approve' | 'reject' | 'resend' | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Action handlers
const handleApprove = async () => {
  if (!props.application) return
  
  if (!confirm('Are you sure you want to approve this application? An activation link will be sent to the parent.')) {
    return
  }

  isProcessing.value = true
  actionType.value = 'approve'
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.approveApplication(props.application.id)
    successMessage.value = 'Application approved successfully! Activation email sent to parent.'
    
    setTimeout(() => {
      emit('approved')
      handleClose()
    }, 2000)
  } catch (error: any) {
    console.error('Error approving application:', error)
    errorMessage.value = error.message || 'Failed to approve application'
    actionType.value = null
  } finally {
    isProcessing.value = false
  }
}

const handleReject = async () => {
  if (!props.application) return
  
  if (!confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
    return
  }

  isProcessing.value = true
  actionType.value = 'reject'
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.rejectApplication(props.application.id)
    successMessage.value = 'Application rejected successfully.'
    
    setTimeout(() => {
      emit('rejected')
      handleClose()
    }, 2000)
  } catch (error: any) {
    console.error('Error rejecting application:', error)
    errorMessage.value = error.message || 'Failed to reject application'
    actionType.value = null
  } finally {
    isProcessing.value = false
  }
}

const handleResendEmail = async () => {
  if (!props.application) return

  isProcessing.value = true
  actionType.value = 'resend'
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await applicationService.resendActivationEmail(props.application.id)
    successMessage.value = 'Activation email resent successfully!'
    
    setTimeout(() => {
      errorMessage.value = ''
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error resending email:', error)
    errorMessage.value = error.message || 'Failed to resend activation email'
  } finally {
    isProcessing.value = false
    actionType.value = null
  }
}

const handleClose = () => {
  errorMessage.value = ''
  successMessage.value = ''
  actionType.value = null
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Application Details</h2>
        <button class="close-btn" @click="handleClose" :disabled="isProcessing">✕</button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Messages -->
        <div v-if="errorMessage" class="alert alert-error">
          <span class="alert-icon">⚠</span>
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="alert alert-success">
          <span class="alert-icon">✓</span>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Loading State -->
        <div v-if="isProcessing" class="processing-overlay">
          <div class="spinner"></div>
          <p>Processing...</p>
        </div>

        <!-- Application Info Sections -->
        <div v-if="application" class="application-details">
          <!-- Submission Info -->
          <div class="detail-section">
            <h3 class="section-title">📋 Application Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Submitted Date:</span>
                <span class="value">{{ formatDateTime(application.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status:</span>
                <span class="value">{{ application.status }}</span>
              </div>
            </div>
          </div>

          <!-- Applicant Information -->
          <div class="detail-section">
            <h3 class="section-title">👨‍🎓 Student Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Name:</span>
                <span class="value">{{ application.applicant_first_name }} {{ application.applicant_last_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">{{ application.applicant_email }}</span>
              </div>
              <div class="info-item">
                <span class="label">Phone:</span>
                <span class="value">{{ application.applicant_phone || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Grade Level:</span>
                <span class="value">{{ application.grade_level || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Preferred Language:</span>
                <span class="value">{{ application.preferred_language || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Lessons Per Week:</span>
                <span class="value">{{ application.lessons_per_week || 'Not specified' }}</span>
              </div>
            </div>
          </div>

          <!-- Parent/Guardian Information -->
          <div v-if="application.parent_name || application.parent_email" class="detail-section">
            <h3 class="section-title">👤 Parent/Guardian Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Name:</span>
                <span class="value">{{ application.parent_name || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">{{ application.parent_email || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Phone:</span>
                <span class="value">{{ application.parent_phone || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Availability Information -->
          <div class="detail-section">
            <h3 class="section-title">📅 Availability</h3>
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="label">Available Time Slots:</span>
                <span class="value">{{ consolidateTimeSlots(application.availability_json, application.availability_description) }}</span>
              </div>
              <div v-if="application.availability_description" class="info-item full-width">
                <span class="label">Special Time Requests:</span>
                <span class="value">{{ application.availability_description }}</span>
              </div>
            </div>
          </div>

          <!-- Learning & Preferences -->
          <div class="detail-section">
            <h3 class="section-title">🎯 Learning & Preferences</h3>
            <div class="info-grid">
              <div class="info-item full-width">
                <span class="label">Desired Subjects:</span>
                <span class="value">{{ getNamesByIds(tryParseArray(application.desired_subjects), 'subjects') }}</span>
              </div>
              <div v-if="application.learning_goals_json" class="info-item full-width">
                <span class="label">Learning Goals:</span>
                <span class="value">{{ getNamesByIds(tryParseArray(application.learning_goals_json), 'learning_goals') }}</span>
              </div>
              <div v-if="application.teacher_preferences_json" class="info-item full-width">
                <span class="label">Teacher Preferences:</span>
                <span class="value">{{ formatTeacherPreferences(application.teacher_preferences_json) }}</span>
              </div>
            </div>
          </div>

          <!-- Additional Application Details -->
          <div v-if="application.source_of_referral || application.is_new_family" class="detail-section">
            <h3 class="section-title">ℹ️ Application Details</h3>
            <div class="info-grid">
              <div v-if="application.source_of_referral" class="info-item">
                <span class="label">Source of Referral:</span>
                <span class="value">{{ application.source_of_referral }}</span>
              </div>
              <div class="info-item">
                <span class="label">New Family:</span>
                <span class="value">{{ application.is_new_family ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer with Actions -->
      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="isProcessing"
        >
          Close
        </button>

        <button
          v-if="application?.status === 'approved'"
          class="btn btn-warning"
          @click="handleResendEmail"
          :disabled="isProcessing"
        >
          {{ actionType === 'resend' && isProcessing ? '⏳ Sending...' : '📧 Resend Activation' }}
        </button>

        <button
          v-else-if="application?.status !== 'rejected'"
          class="btn btn-danger"
          @click="handleReject"
          :disabled="isProcessing"
        >
          {{ actionType === 'reject' && isProcessing ? '⏳ Rejecting...' : '✕ Reject' }}
        </button>

        <button
          v-if="application?.status !== 'approved' && application?.status !== 'rejected'"
          class="btn btn-primary"
          @click="handleApprove"
          :disabled="isProcessing"
        >
          {{ actionType === 'approve' && isProcessing ? '⏳ Approving...' : '✓ Approve' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
  position: relative;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #38aad9 0%, #9bbf19 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Content */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
}

/* Alert Messages */
.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border-left: 4px solid #d32f2f;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #27ae60;
}

.alert-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

/* Processing Overlay */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 100;
  border-radius: 8px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top-color: #38aad9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Detail Sections */
.detail-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #38aad9;
  margin: 0 0 1.2rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #9bbf19;
  display: inline-block;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .value {
  color: #555;
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #38aad9;
}

/* Member Cards */
.member-card {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #9bbf19;
  margin-bottom: 1rem;
}

.member-card:last-child {
  margin-bottom: 0;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.member-name {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 1.05rem;
}

.member-role {
  background: #38aad9;
  color: white;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-info p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
}

/* Subjects List */
.subjects-list {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #38aad9;
  color: #555;
}

/* Notes Box */
.notes-box {
  background: #f0f8ff;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #38aad9;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 2px solid #f0f0f0;
  background: #f9f9f9;
  justify-content: flex-end;
  flex-wrap: wrap;
  border-radius: 0 0 12px 12px;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #27ae60;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
  border: 2px solid #ccc;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
    margin: 1rem;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .modal-footer {
    flex-direction: column-reverse;
    padding: 1rem 1.5rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
