const axios = require('axios');
const { Octokit } = require('@octokit/core');

// Import the custom error classes
const { 
  NotFoundError, 
  ExternalServiceError, 
  AuthenticationError,
  ValidationError
} = require('../utils/errors');

/**
 * Service for interacting with the GitHub API
 */
const githubService = {
  /**
   * Get commits based on filter criteria
   */
  async getCommits({ accessToken, repository, branch = 'main', author, startDate, endDate }) {
    // Construct the GitHub API URL
    const url = `https://api.github.com/repos/${repository}/commits`;
    
    // Set up the parameters for the API request
    const params = {
      sha: branch,
      per_page: 100
    };
    
    if (author) {
      params.author = author;
    }
    
    // Set up the headers with the access token
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
    
    // Make the request to the GitHub API
    const response = await axios.get(url, { params, headers });
    
    // Filter commits by date if needed
    let commits = response.data;
    
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      commits = commits.filter(commit => {
        const commitDate = new Date(commit.commit.author.date).getTime();
        return commitDate >= startDateTime;
      });
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      commits = commits.filter(commit => {
        const commitDate = new Date(commit.commit.author.date).getTime();
        return commitDate <= endDateTime;
      });
    }
    
    // Map the commits to a simpler format
    return commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    }));
  },
  
  /**
   * Get details for a specific commit, including the diff
   */
  async getCommitDetails({ accessToken, repository, commitId }) {
    // Get the commit details
    const url = `https://api.github.com/repos/${repository}/commits/${commitId}`;
    
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
    
    const response = await axios.get(url, { headers });
    const commit = response.data;
    
    // Get the diff
    const diffUrl = `https://api.github.com/repos/${repository}/commits/${commitId}`;
    const diffHeaders = {
      ...headers,
      Accept: 'application/vnd.github.v3.diff'
    };
    
    const diffResponse = await axios.get(diffUrl, { headers: diffHeaders });
    const diff = diffResponse.data;
    
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
      diff
    };
  },

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

      // Extract owner and repo from repository string
      const [owner, repo] = repository.split('/');

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
        fullName: response.data.full_name,
        description: response.data.description,
        defaultBranch: response.data.default_branch,
        private: response.data.private,
        owner: response.data.owner.login,
        avatarUrl: response.data.owner.avatar_url
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
  },

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
        params: { per_page: 100 }
      });
      
      return response.data.map(branch => ({
        name: branch.name,
        protected: branch.protected
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Repository not found or you do not have access to it');
      }
      throw error;
    }
  },

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
        params: { per_page: 100 }
      });
      
      return response.data.map(contributor => ({
        login: contributor.login,
        avatarUrl: contributor.avatar_url,
        contributions: contributor.contributions
      }));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Repository not found or you do not have access to it');
      }
      throw error;
    }
  },

  /**
   * Search for repositories based on a query
   */
  async searchRepositories({ accessToken, query, limit = 10 }) {
    try {
      // First try to search specifically for the user's repositories
      const userReposUrl = 'https://api.github.com/user/repos';
      
      const headers = {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const userReposResponse = await axios.get(userReposUrl, { 
        headers, 
        params: { 
          per_page: 100,
          sort: 'updated',
          direction: 'desc'
        } 
      });
      
      // Filter user repos by the query
      const matchingUserRepos = userReposResponse.data
        .filter(repo => repo.full_name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map(repo => ({
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
          owner: repo.owner.login,
          description: repo.description,
          isPrivate: repo.private,
          stars: repo.stargazers_count,
          defaultBranch: repo.default_branch
        }));
      
      // If we have enough user repos, just return those
      if (matchingUserRepos.length >= limit) {
        return matchingUserRepos;
      }
      
      // Otherwise, search all GitHub repositories the user has access to
      const searchUrl = 'https://api.github.com/search/repositories';
      
      // Search for repositories the user might have access to
      const searchResponse = await axios.get(searchUrl, { 
        headers, 
        params: { 
          q: query,
          per_page: limit - matchingUserRepos.length
        } 
      });
      
      const searchResults = searchResponse.data.items.map(repo => ({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        isPrivate: repo.private,
        stars: repo.stargazers_count,
        defaultBranch: repo.default_branch
      }));
      
      // Combine results, prioritizing user's own repos
      return [...matchingUserRepos, ...searchResults];
    } catch (error) {
      console.error('Error searching repositories:', error);
      return [];
    }
  },

  // Utility function to format dates in ISO format
  formatDate: (date) => {
    return date ? date.toISOString() : null;
  },

  // Search for repositories based on a query string
  async searchRepositoriesByName({ accessToken, query }) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const headers = { Authorization: `token ${accessToken}` };
    const userRepos = [];
    let searchRepos = [];

    try {
      // First search the user's repositories for a faster initial result
      const userReposResponse = await axios.get('https://api.github.com/user/repos', {
        headers,
        params: {
          per_page: 100
        }
      });

      userRepos.push(...userReposResponse.data
        .filter(repo => repo.full_name.toLowerCase().includes(query.toLowerCase()))
        .map(repo => ({
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
          owner: repo.owner.login,
          ownerAvatar: repo.owner.avatar_url,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch
        }))
      );
    } catch (error) {
      console.error('Error searching user repositories:', error.message);
    }

    try {
      // Then search all GitHub repos
      const searchResponse = await axios.get('https://api.github.com/search/repositories', {
        headers,
        params: {
          q: query,
          per_page: 10
        }
      });

      searchRepos = searchResponse.data.items
        .map(repo => ({
          id: repo.id,
          fullName: repo.full_name,
          name: repo.name,
          owner: repo.owner.login,
          ownerAvatar: repo.owner.avatar_url,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.default_branch
        }))
        // Filter out duplicates that might be in userRepos
        .filter(searchRepo => !userRepos.some(userRepo => userRepo.id === searchRepo.id));
    } catch (error) {
      console.error('Error searching GitHub repositories:', error.message);
    }

    // Prioritize user repos in the results
    return [...userRepos, ...searchRepos].slice(0, 10);
  },

  // Get authors who contributed to specific branches
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
              per_page: 100,
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
  },

  // Get date range (first and last commit dates) based on branches and authors
  async getDateRangeForBranchesAndAuthors({ accessToken, repository, branches, authors }) {
    if (!repository || !branches || branches.length === 0) {
      return { firstCommitDate: null, lastCommitDate: null };
    }

    const headers = { Authorization: `token ${accessToken}` };
    const [owner, repo] = repository.split('/');
    let firstCommitDate = null;
    let lastCommitDate = null;

    try {
      // For each branch, get the first and last commits
      for (const branch of branches) {
        // Get latest commits first
        const latestResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
          headers,
          params: {
            sha: branch,
            per_page: 1,
            page: 1,
            ...(authors && authors.length > 0 ? { author: authors.join(',') } : {})
          }
        });

        if (latestResponse.data.length > 0) {
          const latestCommitDate = new Date(latestResponse.data[0].commit.committer.date);
          if (!lastCommitDate || latestCommitDate > lastCommitDate) {
            lastCommitDate = latestCommitDate;
          }
        }

        // Now get the earliest commits - this is more complex as we need to search backwards
        // For simplicity, we'll get all commits and find the oldest
        // In a production scenario, you might want to optimize this with pagination
        let page = 1;
        let hasMore = true;
        let earliestCommitDate = null;

        while (hasMore) {
          const earliestResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
            headers,
            params: {
              sha: branch,
              per_page: 100,
              page,
              ...(authors && authors.length > 0 ? { author: authors.join(',') } : {})
            }
          });

          if (earliestResponse.data.length > 0) {
            // Get the earliest commit date from this batch
            const batchEarliestDate = earliestResponse.data
              .map(commit => new Date(commit.commit.committer.date))
              .reduce((earliest, date) => (!earliest || date < earliest) ? date : earliest, null);

            if (batchEarliestDate && (!earliestCommitDate || batchEarliestDate < earliestCommitDate)) {
              earliestCommitDate = batchEarliestDate;
            }
          }

          // Check if there are more pages
          hasMore = earliestResponse.data.length === 100;
          page++;

          // Safety check to prevent too many API calls
          if (page > 5) {
            break;
          }
        }

        if (earliestCommitDate && (!firstCommitDate || earliestCommitDate < firstCommitDate)) {
          firstCommitDate = earliestCommitDate;
        }
      }

      return { 
        firstCommitDate: firstCommitDate ? firstCommitDate.toISOString() : null, 
        lastCommitDate: lastCommitDate ? lastCommitDate.toISOString() : null 
      };
    } catch (error) {
      console.error(`Error fetching date range for repository ${repository}:`, error.message);
      throw error;
    }
  },

  // Get commits with file diffs
  async getCommitsWithDiffs({ accessToken, repository, branches, authors, startDate, endDate, includeFiles }) {
    // Get commits for each branch
    let allCommits = [];
    
    for (const branch of branches) {
      // Construct the GitHub API URL
      const url = `https://api.github.com/repos/${repository}/commits`;
      
      // Set up query parameters
      const params = {
        sha: branch,
        per_page: 100 // Maximum per page
      };
      
      // Add date range if provided
      if (startDate) {
        params.since = startDate.toISOString();
      }
      
      if (endDate) {
        params.until = endDate.toISOString();
      }
      
      // Set up headers with authentication
      const headers = {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      try {
        // Get commits for this branch
        const response = await axios.get(url, { params, headers });
        const branchCommits = response.data;
        
        // Filter by authors if specified
        let filteredCommits = branchCommits;
        if (authors && authors.length > 0) {
          filteredCommits = branchCommits.filter(commit => {
            // Check if commit author matches any of the specified authors
            const authorName = commit.author?.login || commit.commit.author.name;
            return authors.includes(authorName);
          });
        }
        
        // Fetch file diffs for each commit if requested
        if (includeFiles) {
          for (const commit of filteredCommits) {
            // Check if we already have this commit with files
            const existingCommit = allCommits.find(c => c.sha === commit.sha);
            if (existingCommit && existingCommit.files) {
              continue;
            }
            
            // Fetch commit details with files
            const commitUrl = `https://api.github.com/repos/${repository}/commits/${commit.sha}`;
            const commitResponse = await axios.get(commitUrl, { headers });
            
            // Add files to commit object
            commit.files = commitResponse.data.files;
          }
        }
        
        // Add filtered commits to all commits, avoiding duplicates
        for (const commit of filteredCommits) {
          if (!allCommits.some(c => c.sha === commit.sha)) {
            // Format the commit object for frontend consumption
            const formattedCommit = {
              sha: commit.sha,
              message: commit.commit.message,
              author: {
                login: commit.author?.login,
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                avatar_url: commit.author?.avatar_url
              },
              date: commit.commit.author.date,
              html_url: commit.html_url,
              files: commit.files ? commit.files.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch
              })) : []
            };
            
            allCommits.push(formattedCommit);
          }
        }
      } catch (error) {
        console.error(`Error fetching commits for branch ${branch}:`, error);
        throw error;
      }
    }
    
    // Sort commits by date (newest first)
    allCommits.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return allCommits;
  },

  // Get specific commits by their IDs
  async getCommitsByIds({ accessToken, repository, commitIds }) {
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
    
    const commits = [];
    
    for (const commitId of commitIds) {
      try {
        // Fetch the commit
        const url = `https://api.github.com/repos/${repository}/commits/${commitId}`;
        const response = await axios.get(url, { headers });
        const commit = response.data;
        
        // Format the commit
        const formattedCommit = {
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            login: commit.author?.login,
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            avatar_url: commit.author?.avatar_url
          },
          date: commit.commit.author.date,
          html_url: commit.html_url,
          files: commit.files ? commit.files.map(file => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            patch: file.patch
          })) : []
        };
        
        commits.push(formattedCommit);
      } catch (error) {
        console.error(`Error fetching commit ${commitId}:`, error);
        // Continue with other commits even if one fails
      }
    }
    
    // Sort commits by date (newest first)
    commits.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return commits;
  },

  /**
   * Get branches that contain a specific commit
   * This is a more accurate way to determine which branches contain a commit
   * @param {Object} options - Options
   * @returns {Promise<Array>} - List of branch names
   */
  getBranchesForCommit: async ({ accessToken, repository, commitSha }) => {
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
              const commitAncestryUrl = `https://api.github.com/repos/${repository}/commits?sha=${branch.name}&per_page=100`;
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
  },
};

module.exports = githubService;
