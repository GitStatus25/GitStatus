const axios = require('axios');
const { Octokit } = require('@octokit/core');

// Import the custom error classes
const { 
  NotFoundError, 
  ExternalServiceError, 
  AuthenticationError,
  ValidationError
} = require('../../utils/errors');

/**
 * Service for repository-related GitHub API operations
 */
class GitHubRepositoryService {
  /**
   * Validate and get basic information about a repository
   */
  async getRepositoryInfo({ accessToken, repository }) {
    if (!accessToken) {
      throw new AuthenticationError('GitHub access token is required');
    }

    if (!repository) {
      throw new ValidationError('Repository name is required');
    }

    try {
      // Create an Octokit instance
      const octokit = new Octokit({
        auth: accessToken
      });

      // Handle repository parameter that could be a string "owner/repo" or an object with owner and name properties
      let owner, repo;
      
      if (typeof repository === 'string') {
        // Extract owner and repo from repository string
        [owner, repo] = repository.split('/');
      } else if (typeof repository === 'object' && repository.owner && repository.name) {
        // Extract from object
        owner = repository.owner;
        repo = repository.name;
      } else {
        throw new ValidationError('Invalid repository format. Must be owner/repo string or object with owner and name properties');
      }

      if (!owner || !repo) {
        throw new ValidationError('Invalid repository format. Must be owner/repo');
      }

      // Get repository information
      const response = await octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        name: response.data.name,
        fullName: response.data.fullName,
        description: response.data.description,
        defaultBranch: response.data.defaultBranch,
        isPrivate: response.data.private,
        avatarUrl: response.data.owner.avatarUrl
      };
    } catch (error) {
      // Handle GitHub API errors
      if (error.status === 404) {
        throw new NotFoundError('Repository not found or you do not have access to it');
      }

      if (error.status === 401 || error.status === 403) {
        throw new AuthenticationError('GitHub authentication failed or token has insufficient permissions');
      }

      // For other GitHub API errors
      throw new ExternalServiceError(
        `GitHub API error: ${error.message}`,
        'github'
      );
    }
  }

  /**
   * Get contributors (authors) for a repository
   */
  async getContributors({ accessToken, repository }) {
    try {
      const url = `https://api.github.com/repos/${repository}/contributors`;
      
      const headers = {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const response = await axios.get(url, { 
        headers,
        params: { perPage: 100 }
      });
      
      return response.data.map(contributor => ({
        login: contributor.login,
        avatarUrl: contributor.avatarUrl,
        contributions: contributor.contributions
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Repository not found or you do not have access to it');
      }
      throw error;
    }
  }

  // Utility function to format dates in ISO format
  formatDate(date) {
    return date ? date.toISOString() : null;
  }
}

module.exports = new GitHubRepositoryService(); 