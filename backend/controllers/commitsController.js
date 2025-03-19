/**
 * This file is maintained for backward compatibility.
 * It re-exports the functionality from the more specialized GitHub controllers.
 * For new code, import directly from controllers/GitHub/index.js
 */

const { 
  RepositoryController, 
  BranchController, 
  CommitController 
} = require('./GitHub');

// Re-export all methods from individual controllers for backward compatibility
module.exports = {
  // Repository operations
  getRepositoryInfo: RepositoryController.getRepositoryInfo,
  getContributors: RepositoryController.getContributors,
  searchRepositories: RepositoryController.searchRepositories,
  
  // Branch operations
  getBranches: BranchController.getBranches,
  getAuthorsForBranches: BranchController.getAuthorsForBranches,
  
  // Commit operations
  getCommits: CommitController.getCommits,
  getDateRange: CommitController.getDateRange,
  getCommitsWithDiffs: CommitController.getCommitsWithDiffs
};
