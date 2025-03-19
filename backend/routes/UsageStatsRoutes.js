const express = require('express');
const router = express.Router();
const UsageStatsController = require('../controllers/UsageStatsController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get the current user's usage statistics
router.get('/user', UsageStatsController.getUserStats);

// Check if user has reached their report generation limit
router.get('/check-limit', UsageStatsController.checkReportLimit);

// Get admin analytics dashboard data (admin only)
router.get('/admin', UsageStatsController.getAdminStats);

module.exports = router;