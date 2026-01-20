<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@/services/api'

// Reactive data
const profile = ref({
  id: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  date_of_birth: '',
  role: '',
})
const isLoading = ref(false)
const message = ref('')
const isEditing = ref(false)
const showPasswordForm = ref(false)

// Password form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

// Fetch profile data
const fetchProfile = async () => {
  isLoading.value = true
  try {
    const data = await apiService.get('/profile')
    profile.value = data.profile
  } catch (error) {
    console.error('Error fetching profile:', error)
    message.value = 'Failed to load profile'
  } finally {
    isLoading.value = false
  }
}

// Update profile
const updateProfile = async () => {
  if (!profile.value.first_name.trim() || !profile.value.last_name.trim()) {
    message.value = 'First name and last name are required'
    return
  }

  isLoading.value = true
  try {
    await apiService.put('/profile', {
      first_name: profile.value.first_name,
      last_name: profile.value.last_name,
      phone: profile.value.phone,
      date_of_birth: profile.value.date_of_birth,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update profile')
    }

    message.value = 'Profile updated successfully'
    isEditing.value = false
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    message.value = error.message || 'Failed to update profile'
  } finally {
    isLoading.value = false
  }
}

// Change password
const changePassword = async () => {
  if (
    !passwordForm.value.old_password ||
    !passwordForm.value.new_password ||
    !passwordForm.value.confirm_password
  ) {
    message.value = 'All password fields are required'
    return
  }

  if (passwordForm.value.new_password.length < 8) {
    message.value = 'New password must be at least 8 characters long'
    return
  }

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    message.value = 'New passwords do not match'
    return
  }

  isLoading.value = true
  try {
    const response = await fetch('http://localhost:8080/api/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(passwordForm.value),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to change password')
    }

    message.value = 'Password changed successfully'
    showPasswordForm.value = false
    passwordForm.value = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    }
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error changing password:', error)
    message.value = error.message || 'Failed to change password'
  } finally {
    isLoading.value = false
  }
}

// Format phone number for display (partially masked)
const formatPhone = (phone: string) => {
  if (!phone) return 'Not set'
  if (phone.length <= 4) return phone
  return '••• ••• ' + phone.slice(-4)
}

// Format email for display (partially masked)
const formatEmail = (email: string) => {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return local.slice(0, 2) + '•••' + '@' + domain
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  fetchProfile() // Reload original data
}

// Initialize
onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="profile-section">
    <!-- Message Display -->
    <div
      v-if="message"
      class="message"
      :class="{
        error:
          message.includes('Failed') ||
          message.includes('incorrect') ||
          message.includes('required'),
      }"
    >
      {{ message }}
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading profile...</p>
    </div>

    <div v-else class="profile-content">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-large">
          {{ profile.first_name?.charAt(0) }}{{ profile.last_name?.charAt(0) }}
        </div>
        <div class="profile-title">
          <h1>{{ profile.first_name }} {{ profile.last_name }}</h1>
          <p class="role-badge">{{ profile.role }}</p>
        </div>
        <div class="profile-actions">
          <button v-if="!isEditing" @click="isEditing = true" class="btn-primary">
            Edit Profile
          </button>
          <button @click="showPasswordForm = !showPasswordForm" class="btn-secondary">
            {{ showPasswordForm ? 'Cancel Password Change' : 'Change Password' }}
          </button>
        </div>
      </div>

      <!-- Profile Information -->
      <div class="profile-info">
        <h2>Profile Information</h2>

        <div class="info-grid">
          <div class="info-group">
            <label>Email Address</label>
            <div class="info-value masked">
              {{ formatEmail(profile.email) }}
            </div>
          </div>

          <div class="info-group">
            <label>First Name</label>
            <input
              v-if="isEditing"
              v-model="profile.first_name"
              type="text"
              class="form-input"
              placeholder="First Name"
            />
            <div v-else class="info-value">
              {{ profile.first_name }}
            </div>
          </div>

          <div class="info-group">
            <label>Last Name</label>
            <input
              v-if="isEditing"
              v-model="profile.last_name"
              type="text"
              class="form-input"
              placeholder="Last Name"
            />
            <div v-else class="info-value">
              {{ profile.last_name }}
            </div>
          </div>

          <div class="info-group">
            <label>Phone Number</label>
            <input
              v-if="isEditing"
              v-model="profile.phone"
              type="tel"
              class="form-input"
              placeholder="Phone Number"
            />
            <div v-else class="info-value masked">
              {{ formatPhone(profile.phone) }}
            </div>
          </div>

          <div class="info-group">
            <label>Date of Birth</label>
            <input
              v-if="isEditing"
              v-model="profile.date_of_birth"
              type="date"
              class="form-input"
            />
            <div v-else class="info-value">
              {{ profile.date_of_birth || 'Not set' }}
            </div>
          </div>

          <div class="info-group">
            <label>Account Type</label>
            <div class="info-value">
              <span class="role-tag">{{ profile.role }}</span>
            </div>
          </div>
        </div>

        <!-- Edit Actions -->
        <div v-if="isEditing" class="edit-actions">
          <button @click="updateProfile" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="cancelEdit" class="btn-cancel">Cancel</button>
        </div>
      </div>

      <!-- Change Password Form -->
      <div v-if="showPasswordForm" class="password-section">
        <h2>Change Password</h2>
        <div class="password-form">
          <div class="form-group">
            <label for="old-password">Current Password</label>
            <input
              id="old-password"
              v-model="passwordForm.old_password"
              type="password"
              class="form-input"
              placeholder="Enter current password"
            />
          </div>

          <div class="form-group">
            <label for="new-password">New Password</label>
            <input
              id="new-password"
              v-model="passwordForm.new_password"
              type="password"
              class="form-input"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirm_password"
              type="password"
              class="form-input"
              placeholder="Confirm new password"
            />
          </div>

          <div class="password-actions">
            <button @click="changePassword" class="btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Changing...' : 'Change Password' }}
            </button>
            <button @click="showPasswordForm = false" class="btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-section {
  max-width: 800px;
  margin: 0 auto;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c0f5f, #38aad9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.profile-title h1 {
  margin: 0 0 0.5rem 0;
  color: #6c0f5f;
  font-size: 2rem;
}

.role-badge {
  background: #38aad9;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  display: inline-block;
  text-transform: capitalize;
}

.profile-actions {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: #42993c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #357c30;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #38aad9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #2a8fc7;
  transform: translateY(-2px);
}

.btn-cancel {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.profile-info,
.password-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-info h2,
.password-section h2 {
  color: #6c0f5f;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-group label {
  font-weight: bold;
  color: #6c0f5f;
  font-size: 0.9rem;
}

.info-value {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.info-value.masked {
  font-family: monospace;
  letter-spacing: 0.5px;
}

.role-tag {
  background: #6c0f5f;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #38aad9;
}

.edit-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
}

.password-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-actions {
    margin-left: 0;
    flex-direction: column;
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
