/**
 * API Service with CSRF protection and secure request handling
 */

interface FetchOptions extends RequestInit {
  includeCredentials?: boolean
}

class ApiService {
  private baseURL: string
  private csrfToken: string | null = null
  private csrfTokenPromise: Promise<string | null> | null = null

  constructor(baseURL?: string) {
    // Use environment variable if available, otherwise fallback to localhost
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    this.initCSRFToken()
  }

  /**
   * Initialize CSRF token - only check for meta tag
   * LAZY LOADING: Only fetch from backend when needed (on first POST/PUT/DELETE request)
   * This ensures a session exists before fetching the token
   */
  private initCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    this.csrfToken = metaTag?.getAttribute('content') || null

    if (this.csrfToken) {
      console.log('[apiService] ✓ CSRF token found in meta tag')
    } else {
      console.log('[apiService] ℹ No CSRF token in meta tag - will fetch lazily when first POST/PUT/DELETE is made')
    }
  }

  /**
   * Fetch CSRF token from backend
   * Called lazily: only when first POST/PUT/DELETE request is made
   */
  private fetchCSRFToken(): Promise<string | null> {
    // Return existing promise if already fetching
    if (this.csrfTokenPromise) {
      console.log('[apiService] ↻ CSRF token already being fetched, reusing promise')
      return this.csrfTokenPromise
    }

    console.log('[apiService] → Fetching CSRF token from backend (user is now authenticated)')
    this.csrfTokenPromise = fetch(`${this.baseURL}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Failed to fetch CSRF token')
      })
      .then((data) => {
        // The backend returns { csrf_token: "..." }
        const token = data.csrf_token || data.token
        if (token) {
          this.csrfToken = token
          console.log('[apiService] ✓ CSRF token fetched and cached successfully')
          return token
        }
        console.error('[apiService] ✗ No token in CSRF response', data)
        return null
      })
      .catch((error) => {
        console.error('[apiService] ✗ Failed to fetch CSRF token:', error)
        return null
      })
      .finally(() => {
        // Reset promise so next request can try again if needed
        this.csrfTokenPromise = null
      })

    return this.csrfTokenPromise
  }

  /**
   * Get CSRF token
   */
  public getCSRFToken(): string | null {
    return this.csrfToken
  }

  /**
   * Set CSRF token
   */
  public setCSRFToken(token: string) {
    this.csrfToken = token
  }

  /**
   * Make a request with CSRF protection
   * Includes automatic retry on CSRF token errors (403)
   */
  private async request(
    endpoint: string,
    options: FetchOptions = {},
    retryCount: number = 0
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`
    const method = (options.method || 'GET').toUpperCase()
    const MAX_CSRF_RETRIES = 1 // Prevent infinite loops - only retry once

    const defaultOptions: FetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...options,
    }

    // Ensure CSRF token is available for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // If we don't have a token, fetch it first
      if (!this.csrfToken) {
        await this.fetchCSRFToken()
      }

      if (this.csrfToken) {
        (defaultOptions.headers as Record<string, string>)['X-CSRF-Token'] = this.csrfToken
        console.log(`[apiService]  Added CSRF token to ${method} request`)
      } else {
        console.warn(`[apiService]  No CSRF token available for ${method} request`)
      }
    }

    console.log(`[apiService]  ${method} ${url}`)
    if (defaultOptions.body) {
      console.log(`[apiService]  Request body:`, defaultOptions.body)
    }

    const response = await fetch(url, defaultOptions)

    console.log(`[apiService]  Response status: ${response.status}`)

    // Handle CSRF token errors (both 401 and 403)
    // Clone response so we can read the body for error checking AND pass it to handleResponse
    if ((response.status === 401 || response.status === 403) && retryCount < MAX_CSRF_RETRIES) {
      const clonedResponse = response.clone()
      const data = await clonedResponse.json().catch(() => ({}))
      if (
        data.error?.includes('CSRF') ||
        data.error?.includes('csrf') ||
        data.message?.includes('CSRF') ||
        data.action?.includes('CSRF')
      ) {
        console.log('[apiService]  CSRF token error detected, refreshing token and retrying...')
        this.csrfToken = null
        this.csrfTokenPromise = null // Reset promise to force fresh fetch
        await this.fetchCSRFToken()
        // Retry the request with new token
        return this.request(endpoint, options, retryCount + 1)
      }
    }

    return response
  }

  /**
   * GET request
   */
  public async get(endpoint: string, options?: FetchOptions) {
    const response = await this.request(endpoint, { ...options, method: 'GET' })
    return this.handleResponse(response)
  }

  /**
   * POST request
   */
  public async post(endpoint: string, data?: any, options?: FetchOptions) {
    const response = await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse(response)
  }

  /**
   * PUT request
   */
  public async put(endpoint: string, data?: any, options?: FetchOptions) {
    const response = await this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse(response)
  }

  /**
   * DELETE request
   */
  public async delete(endpoint: string, options?: FetchOptions) {
    const response = await this.request(endpoint, {
      ...options,
      method: 'DELETE',
    })
    return this.handleResponse(response)
  }

  /**
   * PATCH request
   */
  public async patch(endpoint: string, data?: any, options?: FetchOptions) {
    const response = await this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse(response)
  }

  /**
   * Handle API response
   */
  private async handleResponse(response: Response) {
    let data: any

    try {
      data = await response.json()
    } catch {
      // Response might not have JSON body
      data = { message: response.statusText }
    }

    console.log(`[apiService] 📋 Response data:`, data)
    console.log(`[apiService] 📋 Response data keys:`, Object.keys(data || {}))
    console.log(`[apiService] 📋 Response data.user:`, data?.user)
    console.log(`[apiService] 📋 Response data.message:`, data?.message)

    if (!response.ok) {
      console.error(`[apiService] ❌ API Error - Status: ${response.status}`)
      console.error(`[apiService] ❌ API Error - Data:`, data)
      const error = new Error(data.error || data.message || 'API request failed')
      ;(error as any).status = response.status
      ;(error as any).response = { status: response.status, data }
      throw error
    }

    console.log(`[apiService] ✅ Response OK`)
    console.log(`[apiService] ✅ Returning data:`, data)
    return data
  }
}

// Export singleton instance
export const apiService = new ApiService()

export default apiService
