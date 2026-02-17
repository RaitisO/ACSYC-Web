<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import '../../styles/views/admin.css'

const router = useRouter()
const route = useRoute()

const registeredEmail = route.query.email as string || 'your email'

const goToLogin = () => {
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="success-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="success-card">
      <div class="success-icon">✓</div>

      <h1>Welcome to the Team!</h1>

      <p class="subtitle">Your teacher account has been created successfully</p>

      <div class="details-section">
        <div class="info-box">
          <p class="registered-email"><strong>Email:</strong> {{ registeredEmail }}</p>
        </div>

        <div class="info-box">
          <h2>You're All Set!</h2>
          <p>
            Your account is active and ready to use. You can now log in to ACSYC and start
            managing your lessons, student connections, and more.
          </p>
        </div>

        <div class="info-box">
          <h2>Next Steps</h2>
          <ol>
            <li>Log in with your new account</li>
            <li>Complete your profile information</li>
            <li>Set up your teaching preferences</li>
            <li>Start connecting with students</li>
          </ol>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="goToLogin" class="login-btn">
          Go to Login
        </button>
      </div>

      <div class="footer-note">
        <p>
          Have questions? Contact our support team for help.
        </p>
      </div>
    </div>
  </div>
</template>
