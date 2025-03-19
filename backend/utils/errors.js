/**
 * GitStatus Error Classes
 * 
 * This file defines standardized error classes for consistent error handling across the application.
 * Each custom error type extends the base Error class with specific properties for different scenarios.
 */

/**
 * Base application error class that all other custom errors extend
 */
class ApplicationError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for when a resource is not found
 */
class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'RESOURCE_NOT_FOUND');
  }
}

/**
 * Error for invalid or bad user input
 */
class ValidationError extends ApplicationError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Error for unauthorized access (not authenticated)
 */
class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

/**
 * Error for forbidden access (authenticated but not authorized)
 */
class AuthorizationError extends ApplicationError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Error for external service failures (GitHub, OpenAI, etc.)
 */
class ExternalServiceError extends ApplicationError {
  constructor(message = 'External service error', service = 'unknown') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error for when a user exceeds rate limits or quotas
 */
class RateLimitError extends ApplicationError {
  constructor(message = 'Rate limit exceeded', limit = null, reset = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.limit = limit;
    this.reset = reset;
  }
}

/**
 * Error for database operations
 */
class DatabaseError extends ApplicationError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.operation = operation;
  }
}

/**
 * Error for PDF generation failures
 */
class PdfGenerationError extends ApplicationError {
  constructor(message = 'PDF generation failed', details = null) {
    super(message, 500, 'PDF_GENERATION_ERROR');
    this.details = details;
  }
}

/**
 * Error for when feature is not implemented
 */
class NotImplementedError extends ApplicationError {
  constructor(message = 'This feature is not implemented yet') {
    super(message, 501, 'NOT_IMPLEMENTED');
  }
}

/**
 * Function to determine if an error is an instance of ApplicationError
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's an ApplicationError or subclass
 */
const isApplicationError = (error) => {
  return error instanceof ApplicationError;
};

/**
 * Converts a generic Error to an ApplicationError
 * @param {Error} error - The error to convert
 * @param {string} defaultMessage - Default message if none is provided
 * @returns {ApplicationError} - A standardized application error
 */
const toApplicationError = (error, defaultMessage = 'An unexpected error occurred') => {
  if (isApplicationError(error)) {
    return error;
  }
  
  const message = error.message || defaultMessage;
  
  // Try to determine appropriate error type based on message content
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ExternalServiceError(`Service connection error: ${message}`);
  }
  
  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    return new ExternalServiceError(`Service timeout: ${message}`);
  }
  
  return new ApplicationError(message);
};

module.exports = {
  ApplicationError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ExternalServiceError,
  RateLimitError,
  DatabaseError,
  PdfGenerationError,
  NotImplementedError,
  isApplicationError,
  toApplicationError
}; 