const { GitHubBranchService } = require('../../services/GitHub');

/**
 * Controller for handling branch-related operations
 */
class BranchController {
  /**
   * Get branches for a repository
   */
  async getBranches(req, res) {
    try {
      const { repository } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
      }

      const accessToken = req.user.accessToken;
      const branches = await GitHubBranchService.getBranches({
        accessToken,
        repository
      });

      res.json(branches);
    } catch (error) {
      console.error('Error getting branches:', error);
      res.status(500).json({ message: 'Failed to get branches', error: error.message });
    }
  }

  /**
   * Get authors for specific branches in a repository
   */
  async getAuthorsForBranches(req, res) {
    try {
      const { repository, branches } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
      }

      if (!branches) {
        return res.status(400).json({ message: 'At least one branch is required' });
      }

      const branchesArray = Array.isArray(branches) ? branches : [branches];
      const accessToken = req.user.accessToken;
      
      const authors = await GitHubBranchService.getAuthorsForBranches({ 
        accessToken, 
        repository,
        branches: branchesArray
      });

      res.json(authors);
    } catch (error) {
      console.error('Error getting authors for branches:', error);
      res.status(500).json({ message: 'Failed to get authors for branches', error: error.message });
    }
  }
}

module.exports = new BranchController(); 