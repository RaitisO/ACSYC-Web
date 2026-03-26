<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  error: '',
  hint: '',
  maxlength: 255,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: []
  focus: []
}>()

const hasError = computed(() => !!props.error)
const inputId = computed(() => `input-${props.label.toLowerCase().replace(/\s+/g, '-')}`)

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const value = props.type === 'number' ? parseFloat(target.value) || '' : target.value
  emit('update:modelValue', value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFocus = () => {
  emit('focus')
}
</script>

<template>
  <div class="form-input-group">
    <label :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-asterisk">*</span>
    </label>
    <input
      :id="inputId"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :required="required"
      :class="['form-input', { 'form-input--error': hasError }]"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="hint" class="form-hint">{{ hint }}</p>
  </div>
</template>
