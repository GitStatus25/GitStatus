/**
 * Frontend Error Handling Utilities
 * 
 * This file provides standardized error handling for the frontend application.
 * It includes utilities for parsing API errors, handling specific error types,
 * and displaying consistent error messages to users.
 */

/**
 * Standard error types for client-side handling
 */
export const ErrorTypes = {
  AUTHENTICATION: 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION: 'FORBIDDEN',
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Parse and normalize API error responses
 * 
 * @param {Error} error - Error object from API call
 * @returns {Object} Normalized error with type, message, and details
 */
export const parseApiError = (error) => {
  // Default error structure
  const parsedError = {
    type: ErrorTypes.UNKNOWN,
    message: 'An unexpected error occurred',
    details: null,
    originalError: error
  };

  // Handle axios error responses
  if (error.response) {
    const { status, data } = error.response;
    
    // Check if the response follows our API error format
    if (data && data.error) {
      parsedError.message = data.error.message || 'An error occurred';
      parsedError.details = data.error.details || null;
      
      // Map API error codes to client error types
      switch (data.error.code) {
        case 'AUTHENTICATION_REQUIRED':
          parsedError.type = ErrorTypes.AUTHENTICATION;
          break;
        case 'FORBIDDEN':
          parsedError.type = ErrorTypes.AUTHORIZATION;
          break;
        case 'VALIDATION_ERROR':
          parsedError.type = ErrorTypes.VALIDATION;
          break;
        case 'RATE_LIMIT_EXCEEDED':
          parsedError.type = ErrorTypes.RATE_LIMIT;
          break;
        case 'RESOURCE_NOT_FOUND':
          parsedError.type = ErrorTypes.NOT_FOUND;
          break;
        default:
          parsedError.type = ErrorTypes.SERVER;
      }
    } else {
      // Handle HTTP status codes for non-standard responses
      switch (status) {
        case 401:
          parsedError.type = ErrorTypes.AUTHENTICATION;
          parsedError.message = 'Authentication required';
          break;
        case 403:
          parsedError.type = ErrorTypes.AUTHORIZATION;
          parsedError.message = 'You do not have permission to perform this action';
          break;
        case 404:
          parsedError.type = ErrorTypes.NOT_FOUND;
          parsedError.message = 'Resource not found';
          break;
        case 429:
          parsedError.type = ErrorTypes.RATE_LIMIT;
          parsedError.message = 'Rate limit exceeded. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          parsedError.type = ErrorTypes.SERVER;
          parsedError.message = 'Server error. Please try again later.';
          break;
        default:
          parsedError.message = data?.message || 'An error occurred';
      }
    }
  } else if (error.request) {
    // Request was made but no response received (network error)
    parsedError.type = ErrorTypes.NETWORK;
    parsedError.message = 'Network error. Please check your connection and try again.';
  }

  return parsedError;
};

/**
 * Get user-friendly error message
 * 
 * @param {Error|Object} error - Error object (raw or parsed)
 * @returns {string} User-friendly error message
 */
export const getFriendlyErrorMessage = (error) => {
  // If already parsed, use the message
  if (error.type && error.message) {
    return error.message;
  }
  
  // Otherwise parse the error first
  const parsedError = parseApiError(error);
  return parsedError.message;
};

/**
 * Check if the error is an authentication error
 * 
 * @param {Error|Object} error - Error object (raw or parsed)
 * @returns {boolean} Whether it's an authentication error
 */
export const isAuthError = (error) => {
  const parsedError = error.type ? error : parseApiError(error);
  return parsedError.type === ErrorTypes.AUTHENTICATION;
};

/**
 * Get validation error details if available
 * 
 * @param {Error|Object} error - Error object (raw or parsed)
 * @returns {Array|null} Array of validation errors or null
 */
export const getValidationErrors = (error) => {
  const parsedError = error.type ? error : parseApiError(error);
  return parsedError.type === ErrorTypes.VALIDATION ? parsedError.details : null;
};

/**
 * Handle common error scenarios
 * 
 * @param {Error} error - Original error
 * @param {Object} options - Error handling options
 * @param {Function} options.navigate - React Router navigate function
 * @param {Function} options.showNotification - Function to show UI notification
 * @param {boolean} options.redirectOnAuth - Whether to redirect on auth errors
 * @returns {Object} Parsed error
 */
export const handleError = (error, options = {}) => {
  const { navigate, showNotification, redirectOnAuth = true } = options;
  const parsedError = parseApiError(error);
  
  // Log detailed error to console for debugging
  console.error('Error:', {
    type: parsedError.type,
    message: parsedError.message,
    details: parsedError.details,
    originalError: error
  });
  
  // Handle authentication errors - redirect to login
  if (parsedError.type === ErrorTypes.AUTHENTICATION && redirectOnAuth && navigate) {
    navigate('/login', { 
      state: { 
        from: window.location.pathname,
        authRequired: true
      } 
    });
  }
  
  // Show notification if function provided
  if (showNotification) {
    showNotification({
      message: parsedError.message,
      type: 'error'
    });
  }
  
  return parsedError;
};

export default {
  ErrorTypes,
  parseApiError,
  getFriendlyErrorMessage,
  isAuthError,
  getValidationErrors,
  handleError
}; 