const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user', 'repo'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed` 
  }),
  authController.githubCallback
);

// Get current user
router.get('/me', authController.getCurrentUser);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
