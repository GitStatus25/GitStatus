const { GitHubCommitService } = require('../../services/GitHub');
const { CommitUsageTrackerService } = require('../../services/UsageStats');

/**
 * Controller for handling GitHub commit-related operations
 */
class GitHubCommitController {
  /**
   * Get commits from GitHub
   */
  async getCommits(req, res) {
    try {
      const { repository, branch, author, startDate, endDate } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
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
      console.error('Error getting commits:', error);
      res.status(500).json({ message: 'Failed to get commits', error: error.message });
    }
  }

  /**
   * Get date range for branches and authors
   */
  async getDateRange(req, res) {
    try {
      const { repository, branches, authors } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
      }

      if (!branches) {
        return res.status(400).json({ message: 'At least one branch is required' });
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
      console.error('Error getting date range:', error);
      res.status(500).json({ message: 'Failed to get date range', error: error.message });
    }
  }

  /**
   * Get commits with files/diffs based on filters
   */
  async getCommitsWithDiffs(req, res) {
    try {
      const { repository, branches, authors, startDate, endDate, includeFiles } = req.query;
      
      if (!repository || !branches) {
        return res.status(400).json({ error: 'Repository and branches are required' });
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
      console.error('Error getting commits with diffs:', error);
      res.status(500).json({ error: 'Failed to get commits' });
    }
  }
}

module.exports = new GitHubCommitController(); 