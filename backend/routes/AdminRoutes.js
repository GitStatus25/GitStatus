const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/AdminController');

// Get all users (admin only)
router.get('/users', isAdmin, AdminController.getUsers);

// Update user role (admin only)
router.put('/users/:userId/role', isAdmin, AdminController.updateUserRole);

// Update user plan (admin only)
router.put('/users/:userId/plan', isAdmin, AdminController.updateUserPlan);

// Get admin analytics (admin only)
router.get('/analytics', isAdmin, AdminController.getAnalytics);

// Plan management routes
router.get('/plans', isAdmin, AdminController.getPlans);
router.post('/plans', isAdmin, AdminController.createPlan);
router.put('/plans/:planId', isAdmin, AdminController.updatePlan);

module.exports = router; 