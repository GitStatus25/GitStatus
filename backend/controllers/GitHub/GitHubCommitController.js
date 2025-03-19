const { GitHubCommitService } = require('../../services/GitHub');
const { CommitUsageTrackerService } = require('../../services/UsageStats');
const { ValidationError, ExternalServiceError } = require('../../utils/errors');

/**
 * Controller for handling GitHub commit-related operations
 */
class GitHubCommitController {
  /**
   * Get commits from GitHub
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getCommits(req, res, next) {
    try {
      const { repository, branch, author, startDate, endDate } = req.query;

      if (!repository) {
        throw new ValidationError('Repository is required');
      }

      const accessToken = req.user.accessToken;
      const userId = req.user.id;
      
      const commits = await GitHubCommitService.getCommits({
        accessToken,
        repository,
        branch: branch || 'main',
        author,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      });

      // No need to track commits here since we're just fetching them
      // They will be tracked when actually analyzed in report generation

      res.json(commits);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get date range for branches and authors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getDateRange(req, res, next) {
    try {
      const { repository, branches, authors } = req.query;

      if (!repository) {
        throw new ValidationError('Repository is required');
      }

      if (!branches) {
        throw new ValidationError('At least one branch is required');
      }

      const branchesArray = Array.isArray(branches) ? branches : [branches];
      const authorsArray = authors ? (Array.isArray(authors) ? authors : [authors]) : [];
      
      const accessToken = req.user.accessToken;
      const dateRange = await GitHubCommitService.getDateRangeForBranchesAndAuthors({ 
        accessToken, 
        repository, 
        branches: branchesArray,
        authors: authorsArray
      });

      res.json(dateRange);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get commits with files/diffs based on filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getCommitsWithDiffs(req, res, next) {
    try {
      const { repository, branches, authors, startDate, endDate, includeFiles } = req.query;
      
      if (!repository || !branches) {
        throw new ValidationError('Repository and branches are required');
      }
      
      // Get user access token
      const accessToken = req.user.accessToken;
      const userId = req.user.id;
      
      // Parse branch names
      const branchNames = branches.split(',');
      
      // Parse author names if present
      const authorNames = authors ? authors.split(',') : [];
      
      // Call GitHub service to get commits with file diffs
      const commits = await GitHubCommitService.getCommitsWithDiffs({
        accessToken,
        repository,
        branches: branchNames,
        authors: authorNames,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeFiles: includeFiles === 'true'
      });
      
      // No need to track commits here since we're just fetching them
      // They will be tracked when actually analyzed in report generation

      res.json(commits);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GitHubCommitController(); 