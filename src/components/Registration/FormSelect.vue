<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  label: string
  options: SelectOption[]
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  error: '',
  hint: '',
  placeholder: 'Select an option',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: []
  change: [value: string | number]
}>()

const hasError = computed(() => !!props.error)
const selectId = computed(() => `select-${props.label.toLowerCase().replace(/\s+/g, '-')}`)

const handleChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = () => {
  emit('blur')
}
</script>

<template>
  <div class="form-select-group">
    <label :for="selectId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-asterisk">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="['form-select', { 'form-select--error': hasError }]"
      @change="handleChange"
      @blur="handleBlur"
    >
      <option disabled value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="hint" class="form-hint">{{ hint }}</p>
  </div>
</template>
