const express = require('express');
const router = express.Router();
const commitsController = require('../controllers/commitsController');
const { isAuthenticated } = require('../middleware/auth');

// Get commits based on filters
router.get('/', isAuthenticated, commitsController.getCommits);

// Search for repositories
router.get('/search-repositories', isAuthenticated, commitsController.searchRepositories);

// Get repository information
router.get('/repository', isAuthenticated, commitsController.getRepositoryInfo);

// Get branches for a repository
router.get('/branches', isAuthenticated, commitsController.getBranches);

// Get contributors for a repository
router.get('/contributors', isAuthenticated, commitsController.getContributors);

// Get authors for a branch
router.get('/branch-authors', isAuthenticated, commitsController.getAuthorsForBranches);

// Get commits for a date range
router.get('/date-range', isAuthenticated, commitsController.getDateRange);

// Get commits with diffs
router.get('/with-diffs', isAuthenticated, commitsController.getCommitsWithDiffs);

module.exports = router;
