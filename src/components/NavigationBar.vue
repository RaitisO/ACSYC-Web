<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'NavigationBar',
})
</script>
<script setup lang="ts">
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

<style scoped>
.navbar {
  background: #fff9d8; /* Light cream background */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 2px solid #f2d422; /* Yellow accent border */
}
.logo {
  height: 40px; /* Adjust based on your logo */
  width: auto;
  max-width: 150px;
  object-fit: contain; /* Ensures logo scales properly */
}

.logo-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.3s ease;
}

.logo-button:hover {
  transform: scale(1.05);
}
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42993c; /* Green company name */
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  background: none;
  border: none;
  color: #6c0f5f; /* Dark purple text */
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
  border-radius: 5px;
}

.nav-link:hover {
  background: #f2d422; /* Yellow background on hover */
  color: #6c0f5f; /* Dark purple text */
  transform: translateY(-2px);
}

.nav-auth {
  display: flex;
  gap: 1rem;
}

.auth-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.login-btn {
  background: #38aad9;
  border: 2px solid #38aad9; /* Blue border */
  color: white; /* Blue text */
}

.login-btn:hover {
  background: #9bbf19;
  border: 2px solid #9bbf19; /* Blue background */
  color: white;
  transform: translateY(-2px);
}

.register-btn {
  background: #bf1ba9; /* Pink background */
  color: white;
  border: 2px solid #bf1ba9; /* Pink border */
}

.register-btn:hover {
  background: #ff9a1f; /* Lime green on hover */
  border-color: #ff9a1f;
  transform: translateY(-2px);
}
</style>
