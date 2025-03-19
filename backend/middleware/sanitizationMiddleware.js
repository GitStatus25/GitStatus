/**
 * Middleware for sanitizing user input
 * Applies basic sanitization to request body, query params, and URL params
 */

const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Sanitize strings
    if (typeof value === 'string') {
      // Remove any HTML tags
      obj[key] = value.replace(/<[^>]*>/g, '');
      
      // Normalize whitespace
      obj[key] = obj[key].replace(/\s+/g, ' ').trim();
    } 
    // Recursively sanitize nested objects
    else if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
      // Check if value is array
      if (Array.isArray(value)) {
        obj[key] = value.map(item => {
          if (typeof item === 'string') {
            return item.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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