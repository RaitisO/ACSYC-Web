import { ref } from 'vue'
import DOMPurify from 'dompurify'

/**
 * Composable for sanitizing user input to prevent XSS attacks
 * Uses DOMPurify to clean HTML content
 */
export function useSanitize() {
  /**
   * Sanitize HTML content to prevent XSS vulnerabilities
   * @param dirty - Raw HTML string that may contain malicious content
   * @param config - Optional DOMPurify configuration
   * @returns Sanitized HTML string safe to display
   */
  const sanitizeHTML = (dirty: string, config?: any) => {
    return DOMPurify.sanitize(dirty, config || { 
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
      ALLOWED_ATTR: ['href', 'title']
    })
  }

  /**
   * Sanitize plain text - removes all HTML tags
   * @param dirty - Raw text that may contain HTML
   * @returns Plain text with HTML removed
   */
  const sanitizeText = (dirty: string) => {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
  }

  /**
   * Sanitize URL to prevent javascript: and data: protocols
   * @param url - URL to sanitize
   * @returns Safe URL or empty string
   */
  const sanitizeURL = (url: string) => {
    if (!url) return ''
    try {
      const parsed = new URL(url, window.location.href)
      if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
        return ''
      }
      return parsed.href
    } catch {
      return ''
    }
  }

  return {
    sanitizeHTML,
    sanitizeText,
    sanitizeURL,
  }
}
