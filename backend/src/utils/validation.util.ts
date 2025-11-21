export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Sanitizes message content to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 * Allows emojis and basic text formatting
 */
export const sanitizeMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = message.replace(/<[^>]*>/g, '');
  
  // Escape special characters that could be used for XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit message length (e.g., 5000 characters)
  const MAX_MESSAGE_LENGTH = 5000;
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  }

  return sanitized;
};

/**
 * Validates message content
 */
export const isValidMessage = (message: string): boolean => {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.length > 5000) {
    return false;
  }

  return true;
};