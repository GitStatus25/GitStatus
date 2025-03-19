// Authentication controller

exports.githubCallback = (req, res) => {
  // Successful authentication, redirect to the frontend callback handler
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`);
};

exports.getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        role: req.user.role
      }
    });
  }
  
  res.json({ 
    isAuthenticated: false,
    user: null
  });
};

exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ message: 'Logged out successfully' });
  });
};
