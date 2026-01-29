import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Global fetch interceptor to rewrite localhost URLs to the configured API base URL
const originalFetch = window.fetch
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

window.fetch = function (...args) {
  let [resource, config] = args

  // Rewrite localhost URLs to use the configured base URL
  if (typeof resource === 'string' && resource.includes('http://localhost:8080/api/')) {
    resource = resource.replace('http://localhost:8080/api/', apiBaseUrl + '/')
  }

  return originalFetch.call(this, resource, config)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
