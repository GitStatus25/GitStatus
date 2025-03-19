const express = require('express');
const router = express.Router();
const { 
  RepositoryController, 
  BranchController, 
  CommitController 
} = require('../controllers/GitHub');
const { isAuthenticated } = require('../middleware/auth');

// Get commits based on filters
router.get('/', isAuthenticated, CommitController.getCommits);

// Search for repositories
router.get('/search-repositories', isAuthenticated, RepositoryController.searchRepositories);

// Get repository information
router.get('/repository', isAuthenticated, RepositoryController.getRepositoryInfo);

// Get branches for a repository
router.get('/branches', isAuthenticated, BranchController.getBranches);

// Get contributors for a repository
router.get('/contributors', isAuthenticated, RepositoryController.getContributors);

// Get authors for a branch
router.get('/branch-authors', isAuthenticated, BranchController.getAuthorsForBranches);

// Get commits for a date range
router.get('/date-range', isAuthenticated, CommitController.getDateRange);

// Get commits with diffs
router.get('/with-diffs', isAuthenticated, CommitController.getCommitsWithDiffs);

module.exports = router;
