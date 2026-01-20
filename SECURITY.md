# ACSYC-Web Security Implementation Guide

## Overview

This document outlines the security measures implemented in the ACSYC-Web application to protect user data and prevent common web vulnerabilities.

## Security Features Implemented

### 1. XSS (Cross-Site Scripting) Prevention

**Status**: ✅ Implemented

#### Methods:
- **DOMPurify Integration**: All user-generated content is sanitized using DOMPurify
- **No v-html Usage**: Removed all `v-html` directives to prevent arbitrary HTML injection
- **Text Interpolation**: Use safe `{{ }}` interpolation for all dynamic content
- **Composable**: `useSanitize.ts` provides three sanitization methods:
  - `sanitizeHTML()` - Sanitize HTML with allowed tags
  - `sanitizeText()` - Remove all HTML tags
  - `sanitizeURL()` - Validate and sanitize URLs

#### Usage Example:
```typescript
import { useSanitize } from '@/composables/useSanitize'

const { sanitizeText, sanitizeURL } = useSanitize()

const userInput = sanitizeText(userProvidedContent)
const safeLink = sanitizeURL(userProvidedURL)
```

### 2. Input Validation

**Status**: ✅ Implemented

#### Features:
- Centralized validation composable: `useFormValidation.ts`
- Real-time field validation with error tracking
- Pre-submission validation prevents malformed data
- Built-in validation rules for common fields:
  - Required fields
  - Email format validation
  - Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
  - Phone number validation
  - Date validation with age verification
  - Min/Max length validation
  - Pattern matching (numeric, alphabetic)

#### Usage Example:
```typescript
import { useFormValidation, ValidationRules } from '@/composables/useFormValidation'

const { registerField, validateField, validateForm } = useFormValidation()

// Register a field with validation rules
registerField('email', '', [
  ValidationRules.required('Email'),
  ValidationRules.email
])

// Validate individual field or entire form
validateField('email')
const isValid = validateForm()
```

### 3. CSRF (Cross-Site Request Forgery) Protection

**Status**: ✅ Implemented

#### Implementation:
- **CSRF Token**: Meta tag in `index.html` holds the CSRF token from the backend
- **API Service**: Centralized `api.ts` service automatically includes CSRF token in all state-changing requests (POST, PUT, DELETE, PATCH)
- **Header Integration**: Token sent as `X-CSRF-Token` header
- **Token Refresh**: Automatic token refresh on 401 CSRF errors

#### Configuration:
```typescript
// api.ts automatically handles CSRF token for all protected requests
await apiService.post('/endpoint', data) // Token included automatically
await apiService.delete('/endpoint') // Token included automatically
```

**Frontend CSRF Setup**:
- Token stored in meta tag: `<meta name="csrf-token" content="" />`
- Backend should populate this meta tag on initial page load
- API service reads token from meta tag on initialization

### 4. Security Headers

**Status**: ✅ Implemented in Vite Config

#### Headers Configured:
- **Content-Security-Policy**: Restricts script and style sources to prevent injection attacks
- **X-Content-Type-Options: nosniff**: Prevents MIME-sniffing
- **X-XSS-Protection**: Enables browser XSS protection
- **X-Frame-Options: SAMEORIGIN**: Prevents clickjacking
- **Referrer-Policy: strict-origin-when-cross-origin**: Controls referrer information leakage
- **Strict-Transport-Security**: Enforces HTTPS

#### CSP Configuration:
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' http://localhost:8080 https://localhost:8080
```

### 5. Dependency Security

**Status**: ✅ npm audit: 0 vulnerabilities

#### Dependencies:
- All npm packages updated and audited
- `dompurify` (^3.x) - HTML sanitization library
- Regular audits required

#### Running Audits:
```bash
npm audit           # Check for vulnerabilities
npm audit fix       # Automatically fix vulnerabilities
```

### 6. Form Security Updates

#### LoginView.vue
- Email and password validation
- Error message display
- API service integration with CSRF protection
- Loading state during submission

#### RegisterView.vue
- Multi-field validation
- Password strength requirements
- Password confirmation matching
- Age verification (minimum 13 years)
- Phone number format validation
- Input sanitization before submission

## Configuration Files

### .env.example
Template for environment variables:
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_CSRF_COOKIE_NAME=csrf_token
VITE_SESSION_TIMEOUT=3600000
```

### vite.config.ts
Security headers configured for dev server. Production builds should use server-level headers (nginx, Apache, etc.)

## Backend Requirements

To fully utilize these security features, the backend server must:

### 1. CSRF Token Generation
- Generate CSRF tokens for each user session
- Include token in response (typically in Set-Cookie header with meta tag value)
- Validate token on all state-changing requests

### 2. Session Management
- Secure HttpOnly, SameSite cookies for session tokens
- Appropriate CORS headers allowing frontend domain
- Token refresh endpoints

### 3. Input Validation
- Server-side validation of all inputs (never trust client-side validation alone)
- Sanitize and validate email format, phone format, date of birth
- Password hashing using bcrypt or similar

### 4. Response Headers
- Implement all security headers at server level for consistency
- Set appropriate CORS policies
- Use HTTPS only (Strict-Transport-Security)

## Security Best Practices

### For Developers:

1. **Always validate on both client and server**
   - Client-side validation improves UX
   - Server-side validation is mandatory for security

2. **Never use v-html with user input**
   - Use DOMPurify composable for any HTML content
   - Use safe interpolation `{{ }}` for text

3. **Always use the API service**
   - Don't use fetch directly
   - API service handles CSRF token automatically

4. **Sanitize before storage**
   - Sanitize user input before storing in localStorage
   - Never store sensitive data in localStorage

5. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages promptly

### For Production:

1. **Enable HTTPS only**
   - Use valid SSL certificates
   - Redirect HTTP to HTTPS

2. **Configure server-level security headers**
   - Use nginx/Apache modules for consistent header deployment
   - Consider using security header services (e.g., securityheaders.com)

3. **Content Delivery Network (CDN)**
   - Cache static assets
   - Distribute load
   - Add WAF (Web Application Firewall)

4. **Monitoring & Logging**
   - Log authentication attempts
   - Monitor for unusual patterns
   - Set up alerts for security events

5. **Database Security**
   - Use parameterized queries
   - Encrypt sensitive fields
   - Implement proper access controls

## Testing Security

### Manual Testing:
```bash
# Check for common vulnerabilities
npm audit

# Build and preview production build
npm run build
npm run preview

# Open browser and test form validation
# Check network tab for CSRF token in headers
```

### Automated Testing:
```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e
```

## Incident Response

If a security vulnerability is discovered:

1. **Immediately notify the security team**
2. **Do not disclose publicly until patch is available**
3. **Run npm audit fix to patch dependencies**
4. **Update documentation and security guide**
5. **Test thoroughly before deployment**
6. **Deploy to production**
7. **Monitor for exploit attempts**

## Security Checklist

- ✅ No v-html usage in any component
- ✅ DOMPurify installed and integrated
- ✅ Form validation composable implemented
- ✅ API service with CSRF protection created
- ✅ Security headers configured in vite.config.ts
- ✅ index.html includes CSRF meta tag
- ✅ npm audit shows 0 vulnerabilities
- ✅ .env.example created
- ✅ CSRF token included in all state-changing requests
- ✅ LoginView.vue updated with validation
- ✅ RegisterView.vue updated with validation

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

## Questions & Support

For security-related questions or to report vulnerabilities, please contact the security team.

---

**Last Updated**: January 19, 2026
**Status**: Security implementation complete
**Audit Result**: 0 vulnerabilities
