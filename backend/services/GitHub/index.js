/**
 * Exports all GitHub-related services
 */

const GitHubRepositoryService = require('./GitHubRepositoryService');
const GitHubCommitService = require('./GitHubCommitService');
const GitHubBranchService = require('./GitHubBranchService');
const GitHubSearchService = require('./GitHubSearchService');
const GitHubService = require('./GitHubService');

module.exports = {
  GitHubRepositoryService,
  GitHubCommitService,
  GitHubBranchService,
  GitHubSearchService,
  GitHubService,
  // Export the default service as a convenient shorthand
  default: GitHubService
}; 