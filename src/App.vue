<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import { useRoute } from 'vue-router'
import '@/styles/base.css'
import '@/styles/components.css'
import '@/styles/dashboard.css'
import '@/styles/utilities.css'

const route = useRoute()
import { onMounted } from 'vue'

const checkBackend = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/health')
    const data = await response.json()
    console.log('Backend response:', data)
  } catch (error) {
    console.error('Backend connection failed:', error)
  }
}

onMounted(() => {
  checkBackend()
})
// Show navbar only on home page
</script>

<template>
  <div id="app">
    <!-- Show navbar on all pages -->
    <NavigationBar v-if="route.path === '/'" />

    <!-- This is where different pages will render -->
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  background: #fff9d8;
}

/* Remove the old section styles from here */
</style>
