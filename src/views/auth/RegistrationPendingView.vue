<script setup lang="ts">
import { useRouter } from 'vue-router'
import '../../styles/views/auth.css'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="pending-container">
    <!-- Back to Home Button -->
    <button @click="goHome" class="back-home-btn">← Back to Home</button>

    <div class="pending-card">
      <div class="success-icon">✓</div>

      <h1>Application Submitted Successfully!</h1>

      <p class="subtitle">Thank you for registering with ACSYC</p>

      <div class="details-section">
        <div class="info-box">
          <h2>What Happens Next?</h2>
          <ol>
            <li>Your application has been received and is pending review</li>
            <li>An admin will review your registration</li>
            <li>You'll receive an email notification once approved</li>
            <li>After approval, you'll be able to log in to your account</li>
          </ol>
        </div>

        <div class="info-box">
          <h2>What to Expect</h2>
          <p>
            The approval process typically takes 1-3 business days. We'll review your family's information and
            verify all details before granting access. Once approved, all family members will be able to log in
            and access their accounts.
          </p>
        </div>

        <div class="info-box">
          <h2>Need Help?</h2>
          <p>
            If you have any questions or encounter issues during the approval process,
            please contact our support team at <strong>support@acsyc.com</strong>
          </p>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="goHome" class="home-btn">
          Back to Home
        </button>
        <button @click="goToLogin" class="login-btn">
          Go to Login
        </button>
      </div>

      <div class="footer-note">
        <p>
          Check your email for updates on your application status.
          Make sure to check your spam folder if you don't see our emails.
        </p>
      </div>
    </div>
  </div>
</template>
