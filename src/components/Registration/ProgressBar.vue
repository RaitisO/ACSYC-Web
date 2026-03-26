<script setup lang="ts">
import { computed } from 'vue'

interface Step {
  number: number
  title: string
  description?: string
}

interface Props {
  currentStep: number
  totalSteps: number
  steps?: Step[]
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
})

const progressPercentage = computed(() => {
  return ((props.currentStep - 1) / (props.totalSteps - 1)) * 100
})

const stepInfos = computed(() => {
  if (props.steps.length > 0) {
    return props.steps
  }
  // Generate default steps if none provided
  return Array.from({ length: props.totalSteps }, (_, i) => ({
    number: i + 1,
    title: `Step ${i + 1}`,
    description: undefined,
  }))
})
</script>

<template>
  <div class="progress-container">
    <!-- Main Progress Bar with Steps -->
    <div class="progress-bar-wrapper">
      <!-- Step Labels on Bar -->
      <div class="progress-steps-labels">
        <div
          v-for="(step, index) in stepInfos"
          :key="step.number"
          :class="['progress-step-label', { 'progress-step-label--active': step.number === currentStep, 'progress-step-label--completed': step.number < currentStep }]"
          :style="{ left: (index / (totalSteps - 1)) * 100 + '%' }"
        >
          {{ step.title }}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-background">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>

      <!-- Step Circles on Bar -->
      <div class="progress-steps-circles">
        <div
          v-for="(step, index) in stepInfos"
          :key="step.number"
          :class="['step-circle', { 'step-circle--active': step.number === currentStep, 'step-circle--completed': step.number < currentStep }]"
          :style="{ left: (index / (totalSteps - 1)) * 100 + '%' }"
        >
          <span v-if="step.number < currentStep" class="step-checkmark">✓</span>
          <span v-else>{{ step.number }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
