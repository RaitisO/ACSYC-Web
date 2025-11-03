<template>
  <select :id="id"></select>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import TomSelect from 'tom-select'

interface Props {
  id: string
  options: Array<{ value: string; text: string }>
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

let tomSelectInstance: any = null

onMounted(() => {
  const selectElement = document.getElementById(props.id) as HTMLSelectElement

  // Clear any existing options
  selectElement.innerHTML = ''

  // Add options to the base select element
  props.options.forEach((option) => {
    const optionElement = document.createElement('option')
    optionElement.value = option.value
    optionElement.textContent = option.text
    selectElement.appendChild(optionElement)
  })

  // Initialize Tom Select
  tomSelectInstance = new TomSelect(selectElement, {
    placeholder: props.placeholder,
    create: false,
    sortField: 'text',
    onChange: (value: string) => {
      emit('update:modelValue', value)
    },
  })

  // Set initial value
  if (props.modelValue) {
    tomSelectInstance.setValue(props.modelValue)
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (tomSelectInstance && newValue !== tomSelectInstance.getValue()) {
      tomSelectInstance.setValue(newValue)
    }
  },
)

watch(
  () => props.options,
  (newOptions) => {
    if (tomSelectInstance) {
      tomSelectInstance.clearOptions()
      newOptions.forEach((option) => {
        tomSelectInstance.addOption({
          value: option.value,
          text: option.text,
        })
      })
      tomSelectInstance.refreshOptions(false)
    }
  },
)

onUnmounted(() => {
  if (tomSelectInstance) {
    tomSelectInstance.destroy()
  }
})
</script>

<style>
@import 'tom-select/dist/css/tom-select.css';

.ts-control {
  border: 2px solid #f2d422 !important;
  border-radius: 8px !important;
  padding: 0.5rem !important;
  background: white;
}

.ts-control.focus {
  border-color: #38aad9 !important;
  box-shadow: 0 0 0 3px rgba(56, 170, 217, 0.1) !important;
}

.ts-dropdown {
  border: 2px solid #f2d422 !important;
  border-radius: 8px !important;
  margin-top: 5px !important;
}

.ts-dropdown .active {
  background: #38aad9 !important;
  color: white !important;
}

.ts-dropdown .selected {
  background: #6c0f5f !important;
  color: white !important;
}
</style>
