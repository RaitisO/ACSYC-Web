<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  label: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  error: '',
  hint: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

const hasError = computed(() => !!props.error)
const checkboxId = computed(() => `checkbox-${props.label.toLowerCase().replace(/\s+/g, '-')}`)

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', target.checked)
}
</script>

<template>
  <div class="form-checkbox-group">
    <div class="checkbox-wrapper">
      <input
        :id="checkboxId"
        :checked="modelValue"
        type="checkbox"
        :disabled="disabled"
        :required="required"
        :class="['form-checkbox', { 'form-checkbox--error': hasError }]"
        @change="handleChange"
      />
      <label :for="checkboxId" class="checkbox-label">
        {{ label }}
        <span v-if="required" class="required-asterisk">*</span>
      </label>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="hint" class="form-hint">{{ hint }}</p>
  </div>
</template>
