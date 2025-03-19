/**
 * Main GitHub service that aggregates functionality from specialized services
 */

// Import specialized services
const GitHubRepositoryService = require('./GitHubRepositoryService');
const GitHubCommitService = require('./GitHubCommitService');
const GitHubBranchService = require('./GitHubBranchService');
const GitHubSearchService = require('./GitHubSearchService');

/**
 * Main service for interacting with the GitHub API
 * This service aggregates functionality from specialized services
 */
class GitHubService {
  constructor() {
    this.repositoryService = GitHubRepositoryService;
    this.commitService = GitHubCommitService;
    this.branchService = GitHubBranchService;
    this.searchService = GitHubSearchService;
  }

  // Repository operations
  getRepositoryInfo(options) {
    return this.repositoryService.getRepositoryInfo(options);
  }

  getContributors(options) {
    return this.repositoryService.getContributors(options);
  }

  // Commit operations
  getCommits(options) {
    return this.commitService.getCommits(options);
  }

  getCommitDetails(options) {
    return this.commitService.getCommitDetails(options);
  }

  getCommitsWithDiffs(options) {
    return this.commitService.getCommitsWithDiffs(options);
  }

  getCommitsByIds(options) {
    return this.commitService.getCommitsByIds(options);
  }

  getDateRangeForBranchesAndAuthors(options) {
    return this.commitService.getDateRangeForBranchesAndAuthors(options);
  }

  // Branch operations
  getBranches(options) {
    return this.branchService.getBranches(options);
  }

  getAuthorsForBranches(options) {
    return this.branchService.getAuthorsForBranches(options);
  }

  getBranchesForCommit(options) {
    return this.branchService.getBranchesForCommit(options);
  }

  // Search operations
  searchRepositories(options) {
    return this.searchService.searchRepositories(options);
  }

  searchRepositoriesByName(options) {
    return this.searchService.searchRepositoriesByName(options);
  }

  // Utility function to format dates in ISO format
  formatDate(date) {
    return date ? date.toISOString() : null;
  }
}

module.exports = new GitHubService(); 