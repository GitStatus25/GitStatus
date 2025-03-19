const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { isAuthenticated } = require('../middleware/auth');
const {
  getReportsValidation,
  generateReportValidation,
  getCommitInfoValidation,
  getReportByIdValidation,
  deleteReportValidation,
  getCacheStatsValidation,
  cleanupReportsCacheValidation,
  cleanupInvalidReportsValidation
} = require('../middleware/validationMiddleware');

// Get reports for a user
router.get('/', isAuthenticated, getReportsValidation, reportsController.getReports);

// Create a new report
router.post('/', isAuthenticated, generateReportValidation, reportsController.generateReport);

// Get commit info with branch details
router.post('/commit-info', isAuthenticated, getCommitInfoValidation, reportsController.getCommitInfo);

// Cleanup invalid reports
router.post('/cleanup', isAuthenticated, cleanupInvalidReportsValidation, reportsController.cleanupInvalidReports);

// Get cache statistics (admin only)
router.get('/cache/stats', isAuthenticated, getCacheStatsValidation, reportsController.getCacheStats);

// Cleanup old/unused cached reports (admin only)
router.post('/cache/cleanup', isAuthenticated, cleanupReportsCacheValidation, reportsController.cleanupReportsCache);

// Get a specific report
router.get('/:id', isAuthenticated, getReportByIdValidation, reportsController.getReportById);

// Delete a report
router.delete('/:id', isAuthenticated, deleteReportValidation, reportsController.deleteReport);

module.exports = router;
