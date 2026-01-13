// Input validation and sanitization utilities for WinVault
// Prevents XSS, injection attacks and validates user input

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  allowedChars?: RegExp;
  forbiddenChars?: RegExp;
  allowEmpty?: boolean;
  trimWhitespace?: boolean;
}

// Common dangerous patterns
const DANGEROUS_PATTERNS = {
  // XSS patterns
  xss: /<script[^>]*>.*?<\/script>/gi,
  // SQL injection patterns
  sql: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
  // Command injection patterns
  command: /[;&|`$(){}[\]]/gi,
  // Path traversal
  pathTraversal: /\.\.[\\/]/gi,
  // File injection
  fileInjection: /[<>:"|?*]/gi,
  // LDAP injection
  ldap: /[()=,*&|]/gi,
  // NoSQL injection
  nosql: /(\$where|\$ne|\$gt|\$lt|\$in|\$nin)/gi
};

// Input sanitization functions
export const sanitizeInput = (input: string, type: 'text' | 'url' | 'email' | 'filename' = 'text'): string => {
  if (!input) return '';

  let sanitized = input;

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  switch (type) {
    case 'text':
      // Remove potentially dangerous HTML
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      // Remove JavaScript event handlers
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>{}[\]]/g, '');
      break;

    case 'url':
      // Ensure URL format is safe
      sanitized = sanitized.replace(/[\s<>"{}|\\^`]/g, '');
      // Prevent javascript: protocol
      sanitized = sanitized.replace(/^(javascript|data|vbscript):/i, '');
      break;

    case 'email':
      // Basic email sanitization
      sanitized = sanitized.toLowerCase();
      sanitized = sanitized.replace(/[<>{}[\]]/g, '');
      sanitized = sanitized.replace(/\s+/g, '');
      break;

    case 'filename':
      // Remove dangerous filename characters
      sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '');
      // Remove path traversal
      sanitized = sanitized.replace(/\.\.[\\/]/g, '');
      // Limit filename length
      sanitized = sanitized.substring(0, 255);
      break;
  }

  return sanitized;
};

// Validate input against rules
export const validateInput = (input: string, rules: ValidationRules): ValidationResult => {
  const errors: string[] = [];
  let sanitized = input;

  // Check if empty
  if (!input && !rules.allowEmpty) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  if (!input) {
    return { isValid: true, errors: [] };
  }

  // Trim whitespace if specified
  if (rules.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Length validation
  if (rules.minLength && sanitized.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }

  if (rules.maxLength && sanitized.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
  }

  // Character validation
  if (rules.allowedChars && !rules.allowedChars.test(sanitized)) {
    errors.push('Contains invalid characters');
  }

  if (rules.forbiddenChars && rules.forbiddenChars.test(sanitized)) {
    errors.push('Contains forbidden characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

// Check for injection attacks
export const checkForInjection = (input: string): { isSafe: boolean; threats: string[] } => {
  const threats: string[] = [];

  // Check XSS
  if (DANGEROUS_PATTERNS.xss.test(input)) {
    threats.push('XSS attempt detected');
  }

  // Check SQL injection
  if (DANGEROUS_PATTERNS.sql.test(input)) {
    threats.push('SQL injection attempt detected');
  }

  // Check command injection
  if (DANGEROUS_PATTERNS.command.test(input)) {
    threats.push('Command injection attempt detected');
  }

  // Check path traversal
  if (DANGEROUS_PATTERNS.pathTraversal.test(input)) {
    threats.push('Path traversal attempt detected');
  }

  // Check file injection
  if (DANGEROUS_PATTERNS.fileInjection.test(input)) {
    threats.push('File injection attempt detected');
  }

  // Check LDAP injection
  if (DANGEROUS_PATTERNS.ldap.test(input)) {
    threats.push('LDAP injection attempt detected');
  }

  // Check NoSQL injection
  if (DANGEROUS_PATTERNS.nosql.test(input)) {
    threats.push('NoSQL injection attempt detected');
  }

  return {
    isSafe: threats.length === 0,
    threats
  };
};

// Validate specific field types
export const validateSiteName = (siteName: string): ValidationResult => {
  const sanitized = sanitizeInput(siteName, 'text');
  const basicValidation = validateInput(sanitized, {
    minLength: 1,
    maxLength: 255,
    allowedChars: /^[a-zA-Z0-9\s\-._]+$/,
    trimWhitespace: true
  });

  const injectionCheck = checkForInjection(sanitized);

  return {
    isValid: basicValidation.isValid && injectionCheck.isSafe,
    errors: [...basicValidation.errors, ...injectionCheck.threats],
    sanitized
  };
};

export const validateUsername = (username: string): ValidationResult => {
  const sanitized = sanitizeInput(username, 'text');
  const basicValidation = validateInput(sanitized, {
    minLength: 1,
    maxLength: 255,
    allowedChars: /^[a-zA-Z0-9\s\-._@]+$/,
    trimWhitespace: true
  });

  const injectionCheck = checkForInjection(sanitized);

  return {
    isValid: basicValidation.isValid && injectionCheck.isSafe,
    errors: [...basicValidation.errors, ...injectionCheck.threats],
    sanitized
  };
};

export const validatePassword = (password: string): ValidationResult => {
  // Passwords should not be sanitized to preserve strength
  const basicValidation = validateInput(password, {
    minLength: 12,
    maxLength: 512,
    allowEmpty: false,
    trimWhitespace: false
  });

  // Additional password security checks
  const errors = [...basicValidation.errors];

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This is a commonly used password');
  }

  // Check for sequential characters
  if (/^(?=.*[0-9])/.test(password) && /(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    errors.push('Avoid sequential numbers');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Avoid repeating characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: password // Don't sanitize passwords
  };
};

export const validateURL = (url: string): ValidationResult => {
  const sanitized = sanitizeInput(url, 'url');
  
  // Basic URL validation
  const urlPattern = /^https?:\/\/(?:www\.)?[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/;
  const basicValidation = validateInput(sanitized, {
    minLength: 5,
    maxLength: 2048,
    allowEmpty: false,
    trimWhitespace: true
  });

  const errors = [...basicValidation.errors];

  if (!urlPattern.test(sanitized)) {
    errors.push('Invalid URL format');
  }

  const injectionCheck = checkForInjection(sanitized);

  return {
    isValid: basicValidation.isValid && injectionCheck.isSafe && urlPattern.test(sanitized),
    errors: [...errors, ...injectionCheck.threats],
    sanitized
  };
};

export const validateNotes = (notes: string): ValidationResult => {
  const sanitized = sanitizeInput(notes, 'text');
  const basicValidation = validateInput(sanitized, {
    maxLength: 10000,
    allowEmpty: true,
    trimWhitespace: true
  });

  const injectionCheck = checkForInjection(sanitized);

  return {
    isValid: basicValidation.isValid && injectionCheck.isSafe,
    errors: [...basicValidation.errors, ...injectionCheck.threats],
    sanitized
  };
};

// Validate file uploads
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // File size check (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  // File type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // File name validation
  const nameValidation = validateInput(file.name, {
    minLength: 1,
    maxLength: 255,
    allowEmpty: false,
    trimWhitespace: true,
    forbiddenChars: /[<>:"|?*\\\/]/g
  });
  
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced CSV injection protection
export const escapeCSVValue = (value: string | undefined): string => {
  if (!value) return '';

  let str = String(value);
  
  // Remove dangerous characters
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  
  // Escape formula injection
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  
  // Escape quotes and newlines
  str = str.replace(/"/g, '""');
  str = str.replace(/\n/g, '\\n');
  str = str.replace(/\r/g, '\\r');
  str = str.replace(/\t/g, '\\t');

  return `"${str}"`;
};

// Safe JSON parsing
export const safeJSONParse = (jsonString: string): { data: any; error?: string } => {
  try {
    // Limit string length to prevent DoS
    if (jsonString.length > 10 * 1024 * 1024) { // 10MB
      return { data: null, error: 'JSON string too large' };
    }

    const data = JSON.parse(jsonString);
    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
};

// Rate limiting for form submissions
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static checkLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }

    if (record.count >= maxAttempts) {
      const waitTime = record.resetTime - now;
      return { allowed: false, waitTime };
    }

    record.count++;
    return { allowed: true };
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Content Security Policy generator
export const generateCSP = (): string => {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Required for React
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://127.0.0.1:19845",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  return directives.join('; ');
};

// Export all validation utilities
export {
  DANGEROUS_PATTERNS
};