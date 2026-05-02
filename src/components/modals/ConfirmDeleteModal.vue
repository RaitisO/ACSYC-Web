<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Delete Lesson</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="delete-confirm">
          <div class="warning-icon">⚠️</div>
          <h3>Are you sure you want to delete this lesson?</h3>
          <p>This action cannot be undone.</p>

          <div v-if="isRecurring" class="recurring-options">
            <h4>This is a recurring lesson</h4>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="selectedOption" value="this" />
                <span class="radio-checkmark"></span>
                Delete only this occurrence
              </label>
              <label class="radio-label">
                <input type="radio" v-model="selectedOption" value="all" />
                <span class="radio-checkmark"></span>
                Delete all future occurrences
              </label>
            </div>
          </div>

          <div class="delete-actions">
            <button type="button" class="btn-keep" @click="close">Cancel</button>
            <button
              type="button"
              class="btn-delete"
              @click="confirm"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Deleting...' : 'Delete Lesson' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  isRecurring: boolean
  onConfirm: (applyToAll: boolean) => Promise<void>
  onClose: () => void
}

const props = defineProps<Props>()

const selectedOption = ref<'this' | 'all'>('this')
const isLoading = ref(false)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      selectedOption.value = 'this'
    }
  },
)

const close = () => {
  props.onClose()
}

const confirm = async () => {
  isLoading.value = true
  try {
    await props.onConfirm(selectedOption.value === 'all')
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
  max-width: 400px;
  width: 90%;
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
  color: #d32f2f;
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

.delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
}

.delete-confirm h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.delete-confirm p {
  margin: 0;
  color: #666;
}

.recurring-options {
  width: 100%;
  padding: 12px;
  background: #fff3cd;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
  text-align: left;
}

.recurring-options h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #333;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 0;
}

.radio-label input[type='radio'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.radio-checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: inline-block;
}

.radio-label input[type='radio']:checked + .radio-checkmark {
  background: #ffc107;
  border-color: #ffc107;
  box-shadow: inset 0 0 0 3px white;
}

.delete-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-keep,
.btn-delete {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-keep {
  background: #e0e0e0;
  color: #333;
}

.btn-keep:hover {
  background: #d0d0d0;
}

.btn-delete {
  background: #d32f2f;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #b71c1c;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
