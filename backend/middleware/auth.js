// Authentication middleware

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: 'Unauthorized. Please log in.' });
};

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
};

// Authentication middleware that attaches user object to requests
exports.authenticate = (req, res, next) => {
  if (req.isAuthenticated()) {
    // User is already authenticated, continue
    return next();
  } else {
    // User is not authenticated
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
};
