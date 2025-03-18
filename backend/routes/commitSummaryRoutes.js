const express = require('express');
const router = express.Router();
const commitSummaryController = require('../controllers/commitSummaryController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Get all commit summaries (with optional filtering)
router.get('/', commitSummaryController.getSummaries);

// Get a specific commit summary by repository and commitId
router.get('/:repository/:commitId', commitSummaryController.getSummaryByCommitId);

// Get commit details by commitIds (batch)
router.post('/details', commitSummaryController.getCommitDetails);

module.exports = router;
