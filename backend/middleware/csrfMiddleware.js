/**
 * Middleware that selectively applies CSRF protection based on HTTP method
 * Only applies protection to state-changing methods (POST, PUT, DELETE, PATCH)
 */
const selectiveCsrfProtection = (csrfProtection) => {
  return (req, res, next) => {
    // Only check CSRF token for state-changing operations
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (stateChangingMethods.includes(req.method)) {
      // Apply CSRF protection
      return csrfProtection(req, res, next);
    }
    
    // Skip CSRF check for GET and other methods
    return next();
  };
};

module.exports = { selectiveCsrfProtection }; 