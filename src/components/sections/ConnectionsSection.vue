<script setup lang="ts">
import { ref, onMounted } from 'vue'
import './ConnectionsSection.css'

// Reactive data
const connectionCode = ref('')
const codeExpiresAt = ref('')
const inputCode = ref('')
const connections = ref<any[]>([])
const isLoading = ref(false)
const message = ref('')

// Fetch user's connection code
const fetchConnectionCode = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/connection-code', {
      credentials: 'include',
    })
    console.log('Response status:', response.status)

    if (!response.ok) throw new Error('Failed to fetch connection code')

    const data = await response.json()
    console.log('Received connection code data:', data)
    connectionCode.value = data.code
    codeExpiresAt.value = new Date(data.expires_at).toLocaleString()
  } catch (error) {
    console.error('Error fetching connection code:', error)
    message.value = 'Failed to load connection code'
  }
}

// Fetch user's connections
const fetchConnections = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/connections', {
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Failed to fetch connections')

    const data = await response.json()
    connections.value = data.connections || []
  } catch (error) {
    console.error('Error fetching connections:', error)
    message.value = 'Failed to load connections'
  }
}

// Connect with another user
const connectUser = async () => {
  if (!inputCode.value.trim()) {
    message.value = 'Please enter a connection code'
    return
  }

  if (inputCode.value.length !== 4) {
    message.value = 'Connection code must be 4 digits'
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    const response = await fetch('http://localhost:8080/api/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ code: inputCode.value }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to connect')
    }

    const data = await response.json()
    message.value = data.message
    inputCode.value = ''

    // Refresh connections list
    fetchConnections()
  } catch (error: any) {
    console.error('Error connecting user:', error)
    message.value = error.message || 'Failed to establish connection'
  } finally {
    isLoading.value = false
  }
}

// Copy code to clipboard
const copyCodeToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(connectionCode.value)
    message.value = 'Code copied to clipboard!'
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed to copy code:', error)
    message.value = 'Failed to copy code'
  }
}

// Refresh code
const refreshCode = async () => {
  await fetchConnectionCode()
  message.value = 'Connection code refreshed!'
  setTimeout(() => {
    message.value = ''
  }, 2000)
}

// Initialize
onMounted(() => {
  fetchConnectionCode()
  fetchConnections()
})
</script>

<template>
  <div class="connections-section">
    <!-- Message Display -->
    <div
      v-if="message"
      class="message"
      :class="{
        error:
          message.includes('Failed') || message.includes('invalid') || message.includes('cannot'),
      }"
    >
      {{ message }}
    </div>

    <!-- Your Connection Code -->
    <div class="code-section">
      <h2>Your Connection Code</h2>
      <p>Share this code with others to connect with you:</p>
      <div class="code-display">
        <div class="code-value">{{ connectionCode }}</div>
        <div class="code-actions">
          <button @click="copyCodeToClipboard" class="btn-secondary">Copy</button>
          <button @click="refreshCode" class="btn-secondary">Refresh</button>
        </div>
      </div>
      <p class="code-expiry">Expires: {{ codeExpiresAt }}</p>
    </div>

    <!-- Connect with Others -->
    <div class="connect-section">
      <h2>Connect with Others</h2>
      <p>Enter someone else's 4-digit code to connect with them:</p>
      <div class="connect-form">
        <input
          v-model="inputCode"
          type="text"
          maxlength="4"
          class="code-input"
          :disabled="isLoading"
        />
        <button @click="connectUser" class="btn-primary" :disabled="isLoading || !inputCode.trim()">
          {{ isLoading ? 'Connecting...' : 'Connect' }}
        </button>
      </div>
    </div>

    <!-- Existing Connections -->
    <div class="connections-list">
      <h2>Your Connections</h2>
      <div v-if="connections.length === 0" class="no-connections">
        <p>No connections yet. Share your code or enter someone else's code to get started!</p>
      </div>
      <div v-else class="connections-grid">
        <div v-for="connection in connections" :key="connection.id" class="connection-card">
          <div class="connection-info">
            <h3>
              {{
                connection.user1_id === $user?.id ? connection.user2_name : connection.user1_name
              }}
            </h3>
            <p class="connection-type">{{ connection.connection_type.replace('-', ' → ') }}</p>
            <p class="connection-date">
              Connected: {{ new Date(connection.created_at).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>