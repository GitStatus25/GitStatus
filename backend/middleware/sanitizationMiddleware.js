/**
 * Middleware for sanitizing user input
 * Applies secure sanitization to request body, query params, and URL params
 * using DOMPurify to prevent XSS attacks
 */
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOMPurify instance with a virtual DOM window
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Sanitize strings
    if (typeof value === 'string') {
      // Sanitize HTML using DOMPurify
      obj[key] = DOMPurify.sanitize(value);
      
      // Normalize whitespace
      obj[key] = obj[key].replace(/\s+/g, ' ').trim();
    } 
    // Recursively sanitize nested objects
    else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
      // Check if value is array
      if (Array.isArray(value)) {
        obj[key] = value.map(item => {
          if (typeof item === 'string') {
            return DOMPurify.sanitize(item).replace(/\s+/g, ' ').trim();
          } else if (item && typeof item === 'object') {
            return sanitizeInput(item);
          }
          return item;
        });
      } else {
        // Handle nested objects
        obj[key] = sanitizeInput(value);
      }
    }
  });
  
  return obj;
};

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize request body, query parameters, and URL parameters
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  
  next();
};

module.exports = {
  sanitizeRequest
}; 