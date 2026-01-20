import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/ACSYC-Web/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: ['a366e23a1fb3.ngrok-free.app'],
    headers: {
      // Content Security Policy - restrict script, style, and object sources
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:8080 https://localhost:8080",
      // Prevent browsers from MIME-sniffing
      'X-Content-Type-Options': 'nosniff',
      // Enable XSS protection in older browsers
      'X-XSS-Protection': '1; mode=block',
      // Prevent clickjacking attacks
      'X-Frame-Options': 'SAMEORIGIN',
      // Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Enforce HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    },
  },
})

