/**
 * API Service with CSRF protection and secure request handling
 */

interface FetchOptions extends RequestInit {
  includeCredentials?: boolean
}

class ApiService {
  private baseURL: string
  private csrfToken: string | null = null

  constructor(baseURL?: string) {
    // Use environment variable if available, otherwise fallback to localhost
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
    this.initCSRFToken()
  }

  /**
   * Initialize CSRF token from meta tag
   */
  private initCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    this.csrfToken = metaTag?.getAttribute('content') || null
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
   */
  private async request(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions: FetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...options,
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'GET').toUpperCase())) {
      if (this.csrfToken) {
        (defaultOptions.headers as Record<string, string>)['X-CSRF-Token'] = this.csrfToken
      }
    }

    console.log(`[apiService] 📤 ${defaultOptions.method || 'GET'} ${url}`)
    if (defaultOptions.body) {
      console.log(`[apiService] 📦 Request body:`, defaultOptions.body)
    }

    const response = await fetch(url, defaultOptions)
    
    console.log(`[apiService] 📥 Response status: ${response.status}`)

    // Check if CSRF token needs refresh (401 with CSRF error)
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}))
      if (data.error?.includes('CSRF')) {
        console.log('[apiService] ⚠️ CSRF token invalid, refreshing...')
        this.initCSRFToken()
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
