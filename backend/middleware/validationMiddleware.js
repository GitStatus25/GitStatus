const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware to check if validation errors exist
 * If errors exist, return a 400 Bad Request with the error messages
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Validation rules for getReports endpoint
 */
const getReportsValidation = [
  // No specific validation needed for this endpoint as it doesn't take parameters
  validateRequest
];

/**
 * Validation rules for generateReport endpoint
 */
const generateReportValidation = [
  body('repository')
    .notEmpty().withMessage('Repository is required')
    .isString().withMessage('Repository must be a string')
    .matches(/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/).withMessage('Repository should be in the format owner/repo'),
  
  body('branches')
    .optional()
    .isArray().withMessage('Branches must be an array'),
  
  body('branches.*')
    .optional()
    .isString().withMessage('Each branch must be a string')
    .trim(),
  
  body('authors')
    .optional()
    .isArray().withMessage('Authors must be an array'),
  
  body('authors.*')
    .optional()
    .isString().withMessage('Each author must be a string')
    .trim(),
  
  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO8601 date')
    .toDate(),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO8601 date')
    .toDate()
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString().withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  
  body('includeCode')
    .optional()
    .isBoolean().withMessage('includeCode must be a boolean'),
  
  body('commitIds')
    .notEmpty().withMessage('Commit IDs are required')
    .isArray().withMessage('Commit IDs must be an array')
    .custom(value => {
      if (value.length === 0) {
        throw new Error('At least one commit ID is required');
      }
      return true;
    }),
  
  body('commitIds.*')
    .isString().withMessage('Each commit ID must be a string')
    .matches(/^[a-f0-9]{7,40}$/).withMessage('Invalid commit ID format')
    .trim(),
  
  validateRequest
];

/**
 * Validation rules for getCommitInfo endpoint
 */
const getCommitInfoValidation = [
  body('repository')
    .notEmpty().withMessage('Repository is required')
    .isString().withMessage('Repository must be a string')
    .matches(/^[a-zA-Z0-9-_.]+\/[a-zA-Z0-9-_.]+$/).withMessage('Repository should be in the format owner/repo'),
  
  body('commitIds')
    .notEmpty().withMessage('Commit IDs are required')
    .isArray().withMessage('Commit IDs must be an array')
    .custom(async (value, { req }) => {
      if (value.length === 0) {
        throw new Error('At least one commit ID is required');
      }
      
      // This validation is just a preliminary check
      // The actual enforcement of user-specific limits is handled in rateLimiter middleware
      // which will have access to the user's plan and limits
      if (value.length > 10000) { // Set an absolute upper limit for safety
        throw new Error('Request exceeds maximum allowed commits');
      }
      
      return true;
    }),
  
  body('commitIds.*')
    .isString().withMessage('Each commit ID must be a string')
    .matches(/^[a-f0-9]{7,40}$/).withMessage('Invalid commit ID format')
    .trim(),
  
  validateRequest
];

/**
 * Validation rules for cleanupInvalidReports endpoint
 */
const cleanupInvalidReportsValidation = [
  // No specific validation needed for this endpoint
  validateRequest
];

/**
 * Validation rules for getReportById endpoint
 */
const getReportByIdValidation = [
  param('id')
    .notEmpty().withMessage('Report ID is required')
    .custom(isValidObjectId).withMessage('Invalid report ID format'),
  
  validateRequest
];

/**
 * Validation rules for getCacheStats endpoint
 */
const getCacheStatsValidation = [
  // No specific validation needed for this endpoint
  validateRequest
];

/**
 * Validation rules for cleanupReportsCache endpoint
 */
const cleanupReportsCacheValidation = [
  query('olderThan')
    .optional()
    .isInt({ min: 1 }).withMessage('olderThan must be a positive integer')
    .toInt(),
  
  query('accessCountLessThan')
    .optional()
    .isInt({ min: 1 }).withMessage('accessCountLessThan must be a positive integer')
    .toInt(),
  
  validateRequest
];

/**
 * Validation rules for deleteReport endpoint
 */
const deleteReportValidation = [
  param('id')
    .notEmpty().withMessage('Report ID is required')
    .custom(isValidObjectId).withMessage('Invalid report ID format'),
  
  body('confirmationName')
    .notEmpty().withMessage('Confirmation name is required')
    .isString().withMessage('Confirmation name must be a string'),
  
  validateRequest
];

module.exports = {
  getReportsValidation,
  generateReportValidation,
  getCommitInfoValidation,
  cleanupInvalidReportsValidation,
  getReportByIdValidation,
  getCacheStatsValidation,
  cleanupReportsCacheValidation,
  deleteReportValidation,
  validateRequest
}; 