<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="success-container">
    <!-- Header Section -->
    <div class="success-header">
      <div class="success-icon">✓</div>
      <h1>Registration Submitted Successfully!</h1>
      <p class="subtitle">Your application has been received</p>
    </div>

    <!-- Main Content -->
    <div class="success-content">
      <div class="info-card">
        <h2>What happens next?</h2>
        
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Check Your Email</h3>
              <p>
                We've sent a verification email to your inbox. 
                <strong>Click the verification link</strong> to confirm your email address.
              </p>
              <p class="note">The link expires in 48 hours.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Admin Review</h3>
              <p>
                Your application will be reviewed by our admin team. 
                This typically takes <strong>1-2 business days</strong>.
              </p>
              <p class="note">We'll notify you via email once approved.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Create Your Accounts</h3>
              <p>
                Once approved, you and your student will receive instructions 
                to create your login accounts using the email addresses provided.
              </p>
              <p class="note">Parent and student accounts are separate.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Start Learning</h3>
              <p>
                Log in to your account to view available lessons, 
                book sessions, and connect with your teacher.
              </p>
              <p class="note">Welcome to ACSYC!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Information Box -->
      <div class="info-box">
        <h3>Important Reminders</h3>
        <ul>
          <li>Check your <strong>spam/junk folder</strong> if you don't see the verification email</li>
          <li>Keep your login credentials safe and confidential</li>
          <li>The verification link expires in 48 hours - act promptly</li>
          <li>If you have questions, contact our support team</li>
        </ul>
      </div>

      <!-- Success Badges -->
      <div class="success-badges">
        <div class="badge">
          <span class="badge-text">Email Sent</span>
        </div>
        <div class="badge">
          <span class="badge-text">Application Stored</span>
        </div>
        <div class="badge">
          <span class="badge-text">Pending Review</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button @click="goHome" class="btn-primary">
        Back to Home
      </button>
    </div>
  </div>
</template>

<style scoped>
.success-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #38aad9 0%, #9bbf19 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.success-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.success-icon {
  font-size: 80px;
  line-height: 1;
  margin-bottom: 20px;
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.success-header h1 {
  font-size: 36px;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.success-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 30px;
}

.success-content h2 {
  font-size: 24px;
  color: #333;
  margin-top: 0;
  margin-bottom: 30px;
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.step {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #38aad9;
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #38aad9;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.step-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.step-content p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.step-content p:last-child {
  margin-bottom: 0;
}

.note {
  color: #38aad9 !important;
  font-style: italic;
  margin-top: 8px !important;
}

.info-box {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.info-box h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-box li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
}

.success-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.badge {
  background: #f0f9ff;
  border: 2px solid #38aad9;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.badge-text {
  font-size: 14px;
  font-weight: 600;
  color: #38aad9;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-primary {
  background: white;
  color: #38aad9;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 768px) {
  .success-container {
    padding: 20px 15px;
  }

  .success-header h1 {
    font-size: 28px;
  }

  .success-content {
    padding: 25px;
  }

  .step {
    flex-direction: column;
    gap: 12px;
  }

  .step-number {
    align-self: flex-start;
  }

  .success-badges {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
