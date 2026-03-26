<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  token?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tokenValid: [token: string]
  tokenInvalid: []
}>()

const route = useRoute()
const isValidating = ref(true)
const isValid = ref(false)
const error = ref('')

const token = computed(() => {
  return props.token || (route.query.token as string) || ''
})

onMounted(async () => {
  if (!token.value) {
    isValid.value = false
    error.value = 'No verification token provided'
    emit('tokenInvalid')
    isValidating.value = false
    return
  }

  // Token validation format check (basic)
  // Full validation happens on backend
  if (token.value.length < 10) {
    isValid.value = false
    error.value = 'Invalid token format'
    emit('tokenInvalid')
    isValidating.value = false
    return
  }

  try {
    // Full validation and API call will be done by parent component
    isValid.value = true
    emit('tokenValid', token.value)
  } catch (err) {
    isValid.value = false
    error.value = 'Token validation failed'
    emit('tokenInvalid')
  } finally {
    isValidating.value = false
  }
})
</script>

<template>
  <div class="token-validator">
    <div v-if="isValidating" class="validating-state">
      <div class="spinner"></div>
      <p>Validating your link...</p>
    </div>

    <div v-else-if="isValid" class="valid-state">
      <div class="checkmark">✓</div>
      <p>Link verified! Complete your registration.</p>
    </div>

    <div v-else class="invalid-state">
      <div class="error-icon">✕</div>
      <p class="error-message">{{ error }}</p>
      <p class="error-hint">This link may have expired. Please request a new verification email.</p>
    </div>
  </div>
</template>
