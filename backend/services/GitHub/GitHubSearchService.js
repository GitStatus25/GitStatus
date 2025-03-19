const axios = require('axios');

/**
 * Service for search-related GitHub API operations
 */
class GitHubSearchService {
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
          perPage: 100,
          sort: 'updated',
          direction: 'desc'
        } 
      });
      
      // Filter user repos by the query
      const matchingUserRepos = userReposResponse.data
        .filter(repo => repo.fullName.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map(repo => ({
          id: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner.login,
          description: repo.description,
          isPrivate: repo.private,
          stars: repo.stargazersCount,
          defaultBranch: repo.defaultBranch
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
          perPage: limit - matchingUserRepos.length
        } 
      });
      
      const searchResults = searchResponse.data.items.map(repo => ({
        id: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description,
        isPrivate: repo.private,
        stars: repo.stargazersCount,
        defaultBranch: repo.defaultBranch
      }));
      
      // Combine results, prioritizing user's own repos
      return [...matchingUserRepos, ...searchResults];
    } catch (error) {
      console.error('Error searching repositories:', error);
      return [];
    }
  }

  /**
   * Search for repositories based on a query string
   */
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
          perPage: 100
        }
      });

      userRepos.push(...userReposResponse.data
        .filter(repo => repo.fullName.toLowerCase().includes(query.toLowerCase()))
        .map(repo => ({
          id: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner.login,
          ownerAvatar: repo.owner.avatarUrl,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.defaultBranch
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
          perPage: 10
        }
      });

      searchRepos = searchResponse.data.items
        .map(repo => ({
          id: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner.login,
          ownerAvatar: repo.owner.avatarUrl,
          description: repo.description,
          isPrivate: repo.private,
          defaultBranch: repo.defaultBranch
        }))
        // Filter out duplicates that might be in userRepos
        .filter(searchRepo => !userRepos.some(userRepo => userRepo.id === searchRepo.id));
    } catch (error) {
      console.error('Error searching GitHub repositories:', error.message);
    }

    // Prioritize user repos in the results
    return [...userRepos, ...searchRepos].slice(0, 10);
  }
}

module.exports = new GitHubSearchService(); 