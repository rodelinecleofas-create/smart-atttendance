/**
 * Input Sanitization Utility
 * Prevents XSS attacks and data corruption
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>"/\\]/g, '');
}

/**
 * Sanitize numeric input
 * @param {string|number} input - Numeric input
 * @returns {number} - Sanitized number or 0
 */
export function sanitizeNumber(input) {
  const num = Number(input);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Sanitize object (recursively sanitize all string values)
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize form data
 * @param {object} formData - Form data object
 * @param {object} schema - Validation schema with field rules
 * @returns {object} - { isValid: boolean, data: sanitized data, errors: validation errors }
 */
export function validateAndSanitize(formData, schema) {
  const errors = {};
  const sanitized = {};

  for (const field in schema) {
    if (!Object.prototype.hasOwnProperty.call(schema, field)) {
      continue;
    }

    const rules = schema[field];
    let value = formData[field];

    // Sanitize based on type
    if (rules.type === 'email') {
      value = sanitizeEmail(value);
    } else if (rules.type === 'number') {
      value = sanitizeNumber(value);
    } else if (rules.type === 'string') {
      value = sanitizeString(value);
    }

    // Validate required
    if (rules.required && !value) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Validate min length
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
      continue;
    }

    // Validate max length
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors[field] = `${field} must be at most ${rules.maxLength} characters`;
      continue;
    }

    // Validate pattern (regex)
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
      continue;
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors[field] = rules.validateMessage || `${field} is invalid`;
      continue;
    }

    sanitized[field] = value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    data: sanitized,
    errors,
  };
}
