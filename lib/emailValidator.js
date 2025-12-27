/**
 * Email validation utilities
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  // Trim whitespace
  email = email.trim()
  
  // Check if empty after trim
  if (email === '') {
    return false
  }
  
  // RFC 5322 compliant regex (simplified but robust)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  // Additional checks
  const hasValidFormat = emailRegex.test(email)
  const hasValidLength = email.length <= 254 // RFC 5321
  const parts = email.split('@')
  const hasValidLocalPart = parts[0] && parts[0].length <= 64
  const hasValidDomain = parts[1] && parts[1].length <= 255
  
  return hasValidFormat && hasValidLength && hasValidLocalPart && hasValidDomain
}

/**
 * Validates and sanitizes email
 * @param {string} email - Email address
 * @returns {Object} - { isValid: boolean, email: string|null, error: string|null }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      email: null,
      error: 'Email is required'
    }
  }
  
  const sanitizedEmail = email.trim().toLowerCase()
  
  if (sanitizedEmail === '') {
    return {
      isValid: false,
      email: null,
      error: 'Email cannot be empty'
    }
  }
  
  if (!isValidEmail(sanitizedEmail)) {
    return {
      isValid: false,
      email: null,
      error: 'Invalid email format. Please use a valid email address (e.g., example@domain.com)'
    }
  }
  
  return {
    isValid: true,
    email: sanitizedEmail,
    error: null
  }
}

/**
 * Validates email configuration for sending emails
 * @returns {Object} - { isConfigured: boolean, error: string|null }
 */
export function validateEmailConfig() {
  const required = {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
  }
  
  const missing = []
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key)
    }
  }
  
  if (missing.length > 0) {
    return {
      isConfigured: false,
      error: `Email configuration is incomplete. Missing: ${missing.join(', ')}. Please configure in .env.local`
    }
  }
  
  // Validate EMAIL_USER is a valid email
  if (!isValidEmail(process.env.EMAIL_USER)) {
    return {
      isConfigured: false,
      error: 'EMAIL_USER must be a valid email address'
    }
  }
  
  return {
    isConfigured: true,
    error: null
  }
}
