const express = require('express');
const router = express.Router();
const { 
  GitHubRepositoryController, 
  GitHubBranchController, 
  GitHubCommitController 
} = require('../controllers/GitHub');
const { isAuthenticated } = require('../middleware/auth');

// Get commits based on filters
router.get('/', isAuthenticated, GitHubCommitController.getCommits);

// Search for repositories
router.get('/search-repositories', isAuthenticated, GitHubRepositoryController.searchRepositories);

// Get repository information
router.get('/repository', isAuthenticated, GitHubRepositoryController.getRepositoryInfo);

// Get branches for a repository
router.get('/branches', isAuthenticated, GitHubBranchController.getBranches);

// Get contributors for a repository
router.get('/contributors', isAuthenticated, GitHubRepositoryController.getContributors);

// Get authors for a branch
router.get('/branch-authors', isAuthenticated, GitHubBranchController.getAuthorsForBranches);

// Get commits for a date range
router.get('/date-range', isAuthenticated, GitHubCommitController.getDateRange);

// Get commits with diffs
router.get('/with-diffs', isAuthenticated, GitHubCommitController.getCommitsWithDiffs);

module.exports = router;
