<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { applicationService } from '@/services'
import '../../styles/views/auth.css'

const router = useRouter()
const route = useRoute()
const activationToken = route.params.token as string

// State management
const activationState = ref<'loading' | 'success' | 'expired' | 'invalid' | 'error'>('loading')
const parentEmail = ref('')
const studentEmail = ref('')
const errorMessage = ref('')

// Function to activate accounts using the token
const validateAndActivateAccounts = async () => {
  if (!activationToken) {
    activationState.value = 'invalid'
    errorMessage.value = 'No activation token provided'
    return
  }

  try {
    console.log('Activating accounts with token:', activationToken.substring(0, 10) + '...')
    
    // Call backend to validate token and activate accounts
    const response = await applicationService.activateAccounts(activationToken)
    
    console.log('Activation response:', response)
    
    // Safely check if response has success property
    if (response && response.success === true) {
      parentEmail.value = response.details?.parent_email || ''
      studentEmail.value = response.details?.student_email || ''
      activationState.value = 'success'
      console.log('✓ Accounts activated successfully')
    } else {
      activationState.value = 'error'
      errorMessage.value = (response && response.message) || 'An unexpected error occurred'
      console.error('Activation failed:', errorMessage.value)
    }
  } catch (error: any) {
    console.error('Activation error:', error)
    
    // Check if it's an expired token error
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error || error.message
      if (errorMsg.includes('expired') || errorMsg.includes('Expired')) {
        activationState.value = 'expired'
        errorMessage.value = 'Your activation link has expired. Please contact support@acsyc.lv for a new link.'
        return
      }
      
      if (errorMsg.includes('not found') || errorMsg.includes('invalid')) {
        activationState.value = 'invalid'
        errorMessage.value = 'Your activation link is invalid or not found.'
        return
      }
      
      activationState.value = 'error'
      errorMessage.value = errorMsg
    } else if (error.response?.status === 404) {
      activationState.value = 'invalid'
      errorMessage.value = 'Activation link not found.'
    } else {
      activationState.value = 'error'
      errorMessage.value = error.message || 'An unexpected error occurred during activation'
    }
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}

// Validate token and activate on component mount
onMounted(() => {
  validateAndActivateAccounts()
})
</script>

<template>
  <div class="activation-container">
    <!-- Loading State -->
    <div v-if="activationState === 'loading'" class="activation-card loading-state">
      <div class="spinner"></div>
      <h1>Activating Your Accounts...</h1>
      <p>Please wait while we set up your parent and student accounts.</p>
    </div>

    <!-- Success State -->
    <div v-if="activationState === 'success'" class="activation-card success-state">
      <div class="checkmark-icon">✓</div>
      <h1>Your Accounts Are Ready!</h1>
      <p class="subtitle">Congratulations! Your accounts have been successfully created.</p>

      <div class="activation-details">
        <div class="detail-box">
          <h3>Parent Account:</h3>
          <p class="email">{{ parentEmail }}</p>
        </div>
        <div class="detail-box">
          <h3>Student Account:</h3>
          <p class="email">{{ studentEmail }}</p>
        </div>
      </div>

      <div class="info-section">
        <h2>What Happens Next?</h2>
        <ol>
          <li>You will receive an email with login credentials for both accounts</li>
          <li>Log in using the provided temporary passwords</li>
          <li>On your first login, you'll be prompted to create a permanent password</li>
          <li>After changing your password, you can start using ACSYC!</li>
        </ol>
      </div>

      <div class="action-buttons">
        <button @click="goToLogin" class="login-btn">
          Go to Login
        </button>
        <button @click="goHome" class="home-btn">
          Back to Home
        </button>
      </div>

      <p class="support-text">
        Check your email for login credentials. If you don't see the email within a few minutes, check your spam folder.
      </p>
    </div>

    <!-- Expired State -->
    <div v-if="activationState === 'expired'" class="activation-card error-state">
      <div class="error-icon">⏰</div>
      <h1>Activation Link Expired</h1>
      <p class="subtitle">Your activation link has expired.</p>

      <div class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="info-section">
        <h2>What Should You Do?</h2>
        <p>Since your activation link has expired, please:</p>
        <ol>
          <li>Contact the ACSYC support team at <strong>support@acsyc.lv</strong></li>
          <li>Provide them with your application email address</li>
          <li>Request a fresh activation link</li>
          <li>They will resend a new activation link that won't expire for 7 days</li>
        </ol>
      </div>

      <div class="action-buttons">
        <button @click="goHome" class="home-btn">
          Back to Home
        </button>
      </div>

      <div class="support-box">
        <p><strong>📧 Support Email:</strong> support@acsyc.lv</p>
      </div>
    </div>

    <!-- Invalid/Not Found State -->
    <div v-if="activationState === 'invalid'" class="activation-card error-state">
      <div class="error-icon">✕</div>
      <h1>Invalid Activation Link</h1>
      <p class="subtitle">We couldn't find this activation link.</p>

      <div class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="info-section">
        <h2>Possible Reasons:</h2>
        <ul>
          <li>The link may have been modified or corrupted</li>
          <li>The link may belong to a different application</li>
          <li>The application may not exist or has been deleted</li>
        </ul>
        <p>
          If you believe this is a mistake, please contact our support team at 
          <strong>support@acsyc.lv</strong> with your application email address.
        </p>
      </div>

      <div class="action-buttons">
        <button @click="goHome" class="home-btn">
          Back to Home
        </button>
      </div>

      <div class="support-box">
        <p><strong>📧 Support Email:</strong> support@acsyc.lv</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="activationState === 'error'" class="activation-card error-state">
      <div class="error-icon">⚠</div>
      <h1>Activation Error</h1>
      <p class="subtitle">An error occurred during account activation.</p>

      <div class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="info-section">
        <h2>What Should You Do?</h2>
        <p>
          Please try again in a few moments. If the problem persists, contact our 
          support team at <strong>support@acsyc.lv</strong> with the following:
        </p>
        <ul>
          <li>Your email address</li>
          <li>The date and time of the error</li>
          <li>This error message</li>
        </ul>
      </div>

      <div class="action-buttons">
        <button @click="validateAndActivateAccounts" class="retry-btn">
          Try Again
        </button>
        <button @click="goHome" class="home-btn">
          Back to Home
        </button>
      </div>

      <div class="support-box">
        <p><strong>📧 Support Email:</strong> support@acsyc.lv</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #38aad9 0%, #9bbf19 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.activation-card {
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.5s ease-out;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 0;
    transform: translateY(0);
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0e0e0;
  border-top-color: #38aad9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 2rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state h1 {
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #666;
  font-size: 1.05rem;
}

/* Success State */
.success-state h1 {
  color: #27ae60;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.success-state .subtitle {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.checkmark-icon {
  font-size: 4rem;
  color: #27ae60;
  margin-bottom: 1rem;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.activation-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 2rem 0;
}

.detail-box {
  background: #f0f8ff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #38aad9;
}

.detail-box h3 {
  color: #38aad9;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-box .email {
  color: #333;
  font-size: 1rem;
  font-weight: 500;
  word-break: break-all;
  margin: 0;
}

/* Error States */
.error-state h1 {
  color: #d32f2f;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-state .subtitle {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 4rem;
  color: #d32f2f;
  margin-bottom: 1rem;
}

.error-message {
  background: #ffebee;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #d32f2f;
  margin-bottom: 2rem;
}

.error-message p {
  color: #c62828;
  font-size: 0.95rem;
  margin: 0;
}

/* Info Section */
.info-section {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  text-align: left;
}

.info-section h2 {
  color: #38aad9;
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
}

.info-section ol,
.info-section ul {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.8;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.info-section li {
  margin-bottom: 0.75rem;
}

.info-section p {
  color: #555;
  font-size: 0.95rem;
  margin: 0.75rem 0;
}

.support-box {
  background: #e8f5e9;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
  margin: 1.5rem 0;
}

.support-box p {
  color: #2e7d32;
  font-size: 0.95rem;
  margin: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.login-btn,
.home-btn,
.retry-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: #38aad9;
  color: white;
}

.login-btn:hover {
  background: #2a8fb5;
}

.home-btn,
.retry-btn {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #ddd;
}

.home-btn:hover,
.retry-btn:hover {
  background: #e8e8e8;
  border-color: #999;
}

.support-text {
  color: #999;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .activation-card {
    padding: 2rem 1.5rem;
  }

  .activation-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .login-btn,
  .home-btn,
  .retry-btn {
    width: 100%;
  }

  .checkmark-icon,
  .error-icon {
    font-size: 3rem;
  }

  .success-state h1,
  .error-state h1 {
    font-size: 1.5rem;
  }
}
</style>
