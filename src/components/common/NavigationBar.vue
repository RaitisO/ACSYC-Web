<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'NavigationBar',
})
</script>
<script setup lang="ts">
import '../../styles/components/navigation.css'
const router = useRouter()
defineOptions({
  name: 'NavigationBar',
})

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'blog', label: 'Blog' },
  { id: 'events', label: 'Events' },
  { id: 'contact', label: 'Contact' },
] as const

// Smooth scroll function
const scrollToSection = (sectionId: string) => {
  // Only scroll if we're on the home page
  if (router.currentRoute.value.path === '/') {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  } else {
    // If we're on another page, navigate to home first
    router.push('/')
    // Wait for navigation to complete, then scroll
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }, 100)
  }
}

const navigateToAuth = (page: string) => {
  router.push(`/${page}`)
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <span class="company-name">
          <img src="/logo.PNG" alt="ACSYC Tutoring" class="logo" />
        </span>
      </div>

      <div class="nav-links">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="scrollToSection(item.id)"
          class="nav-link"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="nav-auth">
        <button @click="navigateToAuth('login')" class="auth-btn login-btn">Log in</button>
        <button @click="navigateToAuth('register')" class="auth-btn register-btn">Register</button>
      </div>
    </div>
  </nav>
</template>
