<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDangerous: false,
  isLoading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-content">
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-message">{{ message }}</p>

          <div class="modal-actions">
            <button
              type="button"
              class="modal-btn modal-btn--secondary"
              :disabled="isLoading"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              :class="['modal-btn', { 'modal-btn--danger': isDangerous, 'modal-btn--primary': !isDangerous }]"
              :disabled="isLoading"
              @click="handleConfirm"
            >
              {{ isLoading ? 'Processing...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
