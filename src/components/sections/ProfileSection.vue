<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserProfile } from '@/composables'
import './ProfileSection.css'

const {
  profile,
  passwordForm,
  isLoading,
  error,
  successMessage,
  isEditing,
  showPasswordForm,
  fetchProfile,
  updateProfile,
  changePassword,
  cancelEdit,
  cancelPasswordChange,
  formatPhoneForDisplay,
  formatEmailForDisplay,
} = useUserProfile()

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="profile-section">
    <!-- Error Message Display -->
    <div v-if="error" class="message error">
      {{ error }}
    </div>

    <!-- Success Message Display -->
    <div v-if="successMessage" class="message success">
      {{ successMessage }}
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
              {{ formatEmailForDisplay(profile.email) }}
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
              {{ formatPhoneForDisplay(profile.phone) }}
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
