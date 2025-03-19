/**
 * Global Error Handler Middleware
 * 
 * This middleware catches all errors thrown in the application and formats them
 * into a standardized response format.
 */

const { isApplicationError, toApplicationError } = require('../utils/errors');

/**
 * Error response formatter
 * Ensures all error responses follow the same structure
 * 
 * @param {Error} err - The error object
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (err) => {
  // Convert to ApplicationError if it's not already
  const appError = isApplicationError(err) ? err : toApplicationError(err);
  
  // Basic error response structure
  const errorResponse = {
    status: 'error',
    error: {
      code: appError.errorCode,
      message: appError.message
    }
  };
  
  // Add validation errors if they exist
  if (appError.errors && appError.errors.length > 0) {
    errorResponse.error.details = appError.errors;
  }
  
  // Add service info for external service errors
  if (appError.service) {
    errorResponse.error.service = appError.service;
  }
  
  // Add rate limit info
  if (appError.limit) {
    errorResponse.error.limit = appError.limit;
    
    if (appError.reset) {
      errorResponse.error.reset = appError.reset;
    }
  }
  
  return errorResponse;
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Convert to ApplicationError if needed
  const appError = isApplicationError(err) ? err : toApplicationError(err);
  
  // Format the error response
  const errorResponse = formatErrorResponse(appError);
  
  // Send the response with the appropriate status code
  res.status(appError.statusCode || 500).json(errorResponse);
};

/**
 * 404 handler for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  err.errorCode = 'ROUTE_NOT_FOUND';
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler
}; 