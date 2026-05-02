<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Edit Lesson' : 'Create New Lesson' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <!-- Selected Time Display -->
        <div v-if="formData.start" class="time-selection">
          <div class="form-group time-input-group">
            <label for="start-time">Start Time:</label>
            <input
              id="start-time"
              v-model="formData.start"
              type="datetime-local"
              class="form-input time-input"
              required
            />
          </div>
          <div class="form-group time-input-group">
            <label for="end-time">End Time:</label>
            <input
              id="end-time"
              v-model="formData.end"
              type="datetime-local"
              class="form-input time-input"
              required
            />
          </div>
        </div>

        <!-- Lesson Form -->
        <form @submit.prevent="submitForm" class="lesson-form">
          <!-- Teacher Selection (Admin only) -->
          <div v-if="showTeacherSelect" class="form-group">
            <label for="teacher">Select Teacher:</label>
            <select id="teacher" v-model="formData.teacher_id" class="form-select" required>
              <option value="">Choose a teacher...</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="String(teacher.id)">
                {{ teacher.first_name }} {{ teacher.last_name }}
              </option>
            </select>
          </div>

          <!-- Student Selection -->
          <div class="form-group">
            <label for="student">Select Student:</label>
            <select id="student" v-model="formData.student_id" class="form-select" required>
              <option value="">Choose a student...</option>
              <option v-for="student in students" :key="student.id" :value="String(student.id)">
                {{ student.first_name }} {{ student.last_name }}
              </option>
            </select>
          </div>

          <!-- Subject Selection -->
          <div class="form-group">
            <label for="subject">Select Subject:</label>
            <select id="subject" v-model="formData.subject_id" class="form-select" required>
              <option value="">Choose a subject...</option>
              <option v-for="subject in subjects" :key="subject.id" :value="String(subject.id)">
                {{ subject.name }}
              </option>
            </select>
          </div>

          <!-- Recurring Checkbox -->
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.is_recurring" type="checkbox" class="checkbox-input" />
              <span class="checkmark"></span>
              Recurring Lesson (weekly at same time)
            </label>
          </div>

          <!-- Error/Success Message -->
          <div v-if="message" class="message" :class="{ error: message.includes('Error') }">
            {{ message }}
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="close">Cancel</button>
            <button type="submit" class="btn-create" :disabled="isLoading">
              {{ isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update Lesson' : 'Create Lesson' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Lesson {
  id?: number | string
  teacher_id: number | string
  student_id: number | string
  subject_id: number | string
  start: string
  end: string
  is_recurring: boolean
  status?: string
}

interface Teacher {
  id: number
  first_name: string
  last_name: string
}

interface Student {
  id: number
  first_name: string
  last_name: string
}

interface Subject {
  id: number
  name: string
}

interface Props {
  isOpen: boolean
  isEditMode?: boolean
  lesson?: Lesson
  teachers?: Teacher[]
  students: Student[]
  subjects: Subject[]
  onSubmit: (data: Lesson) => Promise<void>
  onClose: () => void
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  teachers: () => [],
})

const formData = ref<Lesson>({
  teacher_id: '',
  student_id: '',
  subject_id: '',
  start: '',
  end: '',
  is_recurring: false,
})

const isLoading = ref(false)
const message = ref('')

const showTeacherSelect = computed(() => props.teachers && props.teachers.length > 0)

// Initialize form with lesson data if editing
watch(
  () => props.lesson,
  (newLesson) => {
    if (newLesson && props.isEditMode) {
      formData.value = {
        ...newLesson,
      }
    }
  },
  { immediate: true },
)

// Reset form when modal opens with no lesson (create mode)
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && !props.isEditMode) {
      formData.value = {
        teacher_id: props.teachers?.[0]?.id || '',
        student_id: '',
        subject_id: '',
        start: '',
        end: '',
        is_recurring: false,
      }
      message.value = ''
    }
  },
)

const close = () => {
  message.value = ''
  props.onClose()
}

const submitForm = async () => {
  if (!formData.value.student_id || !formData.value.subject_id || !formData.value.start || !formData.value.end) {
    message.value = 'Please fill in all required fields'
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    await props.onSubmit(formData.value)
    message.value = props.isEditMode ? 'Lesson updated successfully!' : 'Lesson created successfully!'
    setTimeout(() => {
      close()
    }, 1000)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    message.value = `Error: ${errorMsg}`
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #38aad9;
  box-shadow: 0 0 0 2px rgba(56, 170, 217, 0.1);
}

.time-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 16px;
}

.time-input-group {
  flex: 1;
}

.time-input {
  width: 100%;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 3px;
  display: inline-block;
}

.checkbox-input:checked + .checkmark {
  background: #38aad9;
  border-color: #38aad9;
}

.message {
  padding: 12px;
  border-radius: 4px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-create {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

.btn-create {
  background: #38aad9;
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: #2a8fc7;
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
