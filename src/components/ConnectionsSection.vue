<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

<style scoped>
.connections-section {
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

.code-section,
.connect-section,
.connections-list {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.code-section h2,
.connect-section h2,
.connections-list h2 {
  color: #6c0f5f;
  margin-bottom: 1rem;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.code-value {
  font-size: 2rem;
  font-weight: bold;
  color: #42993c;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px dashed #42993c;
  font-family: monospace;
}

.code-actions {
  display: flex;
  gap: 0.5rem;
}

.code-expiry {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

.connect-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.code-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.5rem;
  font-family: monospace;
  text-align: center;
  width: 120px;
  letter-spacing: 0.5rem;
}

.code-input:focus {
  outline: none;
  border-color: #38aad9;
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
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #2a8fc7;
  transform: translateY(-1px);
}

.no-connections {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.connections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.connection-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #38aad9;
}

.connection-info h3 {
  margin: 0 0 0.5rem 0;
  color: #6c0f5f;
}

.connection-type {
  font-weight: bold;
  color: #42993c;
  margin: 0 0 0.5rem 0;
  text-transform: capitalize;
}

.connection-date {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}
</style>
