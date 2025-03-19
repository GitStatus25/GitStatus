const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/AdminController');

// Get all users (admin only)
router.get('/users', isAdmin, AdminController.getUsers);

// Update user role (admin only)
router.put('/users/:userId/role', isAdmin, AdminController.updateUserRole);

// Get admin analytics (admin only)
router.get('/analytics', isAdmin, AdminController.getAnalytics);

module.exports = router; 