<template>
  <select :id="id"></select>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import TomSelect from 'tom-select'
import '../../styles/components/form-inputs.css'

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
