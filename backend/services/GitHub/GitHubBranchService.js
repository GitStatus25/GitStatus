const axios = require('axios');

// Import the custom error classes
const { 
  NotFoundError, 
  ExternalServiceError
} = require('../utils/errors');

/**
 * Service for branch-related GitHub API operations
 */
class GitHubBranchService {
  /**
   * Get all branches for a repository
   */
  async getBranches({ accessToken, repository }) {
    try {
      const url = `https://api.github.com/repos/${repository}/branches`;
      
      const headers = {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const response = await axios.get(url, { 
        headers,
        params: { perPage: 100 }
      });
      
      return response.data.map(branch => ({
        name: branch.name,
        protected: branch.protected
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundError('Repository not found or you do not have access to it');
      }
      throw error;
    }
  }

  /**
   * Get authors who contributed to specific branches
   */
  async getAuthorsForBranches({ accessToken, repository, branches }) {
    if (!repository || !branches || branches.length === 0) {
      return [];
    }

    const headers = { Authorization: `token ${accessToken}` };
    const allAuthors = new Set();
    const [owner, repo] = repository.split('/');

    try {
      // For each branch, fetch commits and collect unique authors
      for (const branch of branches) {
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers,
            params: {
              sha: branch,
              perPage: 100,
              page
            }
          });

          // Extract authors from commits
          response.data.forEach(commit => {
            if (commit.author && commit.author.login) {
              allAuthors.add(commit.author.login);
            }
          });

          // Check if there are more pages
          hasMore = response.data.length === 100;
          page++;

          // Safety check to prevent too many API calls
          if (page > 5) {
            break;
          }
        }
      }

      return Array.from(allAuthors);
    } catch (error) {
      console.error(`Error fetching authors for branches in ${repository}:`, error.message);
      throw error;
    }
  }

  /**
   * Get branches that contain a specific commit
   * This is a more accurate way to determine which branches contain a commit
   * @param {Object} options - Options
   * @returns {Promise<Array>} - List of branch names
   */
  async getBranchesForCommit({ accessToken, repository, commitSha }) {
    try {
      console.log(`Getting branches for commit ${commitSha} in ${repository}`);
      
      // First, verify the commit exists
      try {
        const commitUrl = `https://api.github.com/repos/${repository}/commits/${commitSha}`;
        const headers = {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        };
        
        await axios.get(commitUrl, { headers });
      } catch (error) {
        console.error(`Error verifying commit ${commitSha}:`, error.message);
        return [];
      }
      
      // Get all repository branches
      const url = `https://api.github.com/repos/${repository}/branches`;
      
      const headers = {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const response = await axios.get(url, { headers });
      const branches = response.data;
      
      // First, try the direct GitHub API endpoint for branch containing commit
      // Not all GitHub instances support this, so we'll fall back to our existing method if it fails
      try {
        const containingBranchesUrl = `https://api.github.com/repos/${repository}/commits/${commitSha}/branches-where-head`;
        const containingResponse = await axios.get(containingBranchesUrl, { headers });
        
        if (containingResponse.data && Array.isArray(containingResponse.data)) {
          const branchNames = containingResponse.data.map(branch => branch.name);
          if (branchNames.length > 0) {
            // Limit to max 5 branches per commit to avoid overwhelming the system
            return branchNames.slice(0, 5);
          }
          // If we get an empty array, fall through to the manual check
        }
      } catch (error) {
        console.log('API endpoint not supported, falling back to manual check:', error.message);
        // Fall through to our manual check
      }
      
      // For each branch, check if the commit is reachable
      // Only check the first 5 branches to avoid overwhelming the API
      const branchesToCheck = branches.slice(0, 5);
      console.log(`Checking ${branchesToCheck.length} branches for commit ${commitSha}`);
      
      const branchPromises = branchesToCheck.map(async (branch) => {
        try {
          // First try to get the commit directly in this branch
          try {
            const commitInBranchUrl = `https://api.github.com/repos/${repository}/git/refs/heads/${branch.name}`;
            const branchHeadResponse = await axios.get(commitInBranchUrl, { headers });
            const branchHeadSha = branchHeadResponse.data.object.sha;
            
            // If the branch head SHA matches our commit SHA, it's definitely in this branch
            if (branchHeadSha === commitSha) {
              return branch.name;
            }
            
            // If not, we need to check if it's in the branch history
            try {
              // Use the git/commits API to check commit ancestry
              const commitAncestryUrl = `https://api.github.com/repos/${repository}/commits?sha=${branch.name}&perPage=100`;
              const ancestryResponse = await axios.get(commitAncestryUrl, { headers });
              
              // Check if our commit is in the returned commits
              if (ancestryResponse.data.some(c => c.sha === commitSha)) {
                return branch.name;
              }
            } catch (ancestryError) {
              console.error(`Error checking ancestry for ${branch.name}:`, ancestryError.message);
            }
          } catch (branchError) {
            console.error(`Error getting branch head for ${branch.name}:`, branchError.message);
          }
          
          return null;
        } catch (error) {
          console.error(`Error checking if commit ${commitSha} is in branch ${branch.name}:`, error);
          return null;
        }
      });
      
      const branchResults = await Promise.all(branchPromises);
      return branchResults.filter(branch => branch !== null);
    } catch (error) {
      console.error(`Error getting branches for commit ${commitSha}:`, error);
      return [];
    }
  }
}

module.exports = new GitHubBranchService(); 