const { GitHubRepositoryService, GitHubSearchService } = require('../../services/GitHub');

/**
 * Controller for handling repository-related operations
 */
class RepositoryController {
  /**
   * Get basic information about a repository
   */
  async getRepositoryInfo(req, res) {
    try {
      const { repository } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
      }

      const accessToken = req.user.accessToken;
      const repoInfo = await GitHubRepositoryService.getRepositoryInfo({
        accessToken,
        repository
      });

      res.json(repoInfo);
    } catch (error) {
      console.error('Error getting repository info:', error);
      res.status(500).json({ message: 'Failed to get repository info', error: error.message });
    }
  }

  /**
   * Get contributors for a repository
   */
  async getContributors(req, res) {
    try {
      const { repository } = req.query;

      if (!repository) {
        return res.status(400).json({ message: 'Repository is required' });
      }

      const accessToken = req.user.accessToken;
      const contributors = await GitHubRepositoryService.getContributors({ 
        accessToken, 
        repository 
      });

      res.json(contributors);
    } catch (error) {
      console.error('Error getting contributors:', error);
      res.status(500).json({ message: 'Failed to get contributors', error: error.message });
    }
  }

  /**
   * Search for repositories
   */
  async searchRepositories(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const accessToken = req.user.accessToken;
      const repositories = await GitHubSearchService.searchRepositoriesByName({ 
        accessToken, 
        query 
      });

      res.json(repositories);
    } catch (error) {
      console.error('Error searching repositories:', error);
      res.status(500).json({ message: 'Failed to search repositories', error: error.message });
    }
  }
}

module.exports = new RepositoryController(); 