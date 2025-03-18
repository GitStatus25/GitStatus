const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { isAuthenticated } = require('../middleware/auth');

// Get reports for a user
router.get('/', isAuthenticated, reportsController.getReports);

// Create a new report
router.post('/', isAuthenticated, reportsController.generateReport);

// Get commit info with branch details
router.post('/commit-info', isAuthenticated, reportsController.getCommitInfo);

// Get a specific report
router.get('/:id', isAuthenticated, reportsController.getReportById);

// Delete a report
router.delete('/:id', isAuthenticated, reportsController.deleteReport);

// Get cache statistics (admin only)
router.get('/cache/stats', isAuthenticated, reportsController.getCacheStats);

// Cleanup old/unused cached reports (admin only)
router.post('/cache/cleanup', isAuthenticated, reportsController.cleanupReportsCache);

module.exports = router;
