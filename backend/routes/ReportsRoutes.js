const express = require('express');
const router = express.Router();
const {
  ReportGenerationController,
  ReportViewController,
  ReportManagementController,
  ReportCacheController
} = require('../controllers/Report');
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
const rateLimiter = require('../middleware/rateLimiter');

// Get reports for a user
router.get('/', isAuthenticated, getReportsValidation, ReportViewController.getReports);

// Create a new report
router.post('/', isAuthenticated, generateReportValidation, ReportGenerationController.generateReport);

// Get commit info with branch details
router.post('/commit-info', isAuthenticated, getCommitInfoValidation, rateLimiter.checkCommitLimit, ReportGenerationController.getCommitInfo);

// Cleanup invalid reports
router.post('/cleanup', isAuthenticated, cleanupInvalidReportsValidation, ReportManagementController.cleanupInvalidReports);

// Get cache statistics (admin only)
router.get('/cache/stats', isAuthenticated, getCacheStatsValidation, ReportCacheController.getCacheStats);

// Cleanup old/unused cached reports (admin only)
router.post('/cache/cleanup', isAuthenticated, cleanupReportsCacheValidation, ReportCacheController.cleanupReportsCache);

// Get a specific report
router.get('/:id', isAuthenticated, getReportByIdValidation, ReportViewController.getReportById);

// Delete a report
router.delete('/:id', isAuthenticated, deleteReportValidation, ReportManagementController.deleteReport);

// Get PDF generation status
router.get('/:id/pdf-status', isAuthenticated, getReportByIdValidation, ReportGenerationController.getPdfStatus);

module.exports = router;
