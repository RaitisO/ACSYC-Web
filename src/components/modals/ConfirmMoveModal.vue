<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content move-confirm-modal" @click.stop>
      <div class="modal-header">
        <h2>Move Lesson</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body" v-if="moveInfo">
        <div class="move-info">
          <div class="info-section">
            <h3>{{ moveInfo.title }}</h3>
            <div class="time-change">
              <div class="time-row">
                <span class="time-label">From:</span>
                <span class="time-value">{{ formatDateTime(moveInfo.oldStart) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">To:</span>
                <span class="time-value new-time">{{ formatDateTime(moveInfo.newStart) }}</span>
              </div>
            </div>
          </div>

          <div v-if="moveInfo.isRecurring" class="recurring-options">
            <h4>This is a recurring lesson</h4>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="selectedOption" value="this" />
                <span class="radio-checkmark"></span>
                Change only this occurrence
              </label>
              <label class="radio-label">
                <input type="radio" v-model="selectedOption" value="all" />
                <span class="radio-checkmark"></span>
                Change all future occurrences
              </label>
            </div>
          </div>

          <div class="move-actions">
            <button type="button" class="btn-cancel" @click="close">Cancel</button>
            <button
              type="button"
              class="btn-save"
              @click="confirm"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface MoveInfo {
  id: string | number
  title: string
  oldStart: string
  oldEnd: string
  newStart: string
  newEnd: string
  isRecurring: boolean
}

interface Props {
  isOpen: boolean
  moveInfo?: MoveInfo
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

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

.move-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #333;
}

.time-change {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-weight: 500;
  color: #666;
  min-width: 50px;
}

.time-value {
  color: #333;
}

.time-value.new-time {
  color: #38aad9;
  font-weight: 500;
}

.recurring-options {
  padding: 12px;
  background: #f0f8ff;
  border-radius: 4px;
  border-left: 4px solid #38aad9;
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
  background: #38aad9;
  border-color: #38aad9;
  box-shadow: inset 0 0 0 3px white;
}

.move-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-save {
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

.btn-save {
  background: #38aad9;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #2a8fc7;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
