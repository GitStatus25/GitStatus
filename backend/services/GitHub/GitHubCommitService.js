const axios = require('axios');

// Import the custom error classes
const { 
  NotFoundError, 
  ExternalServiceError, 
  AuthenticationError,
  ValidationError
} = require('../../utils/errors');

/**
 * Service for commit-related GitHub API operations
 */
class GitHubCommitService {
  /**
   * Get commits based on filter criteria
   */
  async getCommits({ accessToken, repository, branch = 'main', author, startDate, endDate }) {
    // Construct the GitHub API URL
    const url = `https://api.github.com/repos/${repository}/commits`;
    
    // Set up the parameters for the API request
    const params = {
      sha: branch,
      perPage: 100
    };
    
    if (author) {
      params.author = author;
    }
    
    // Set up the headers with the access token
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
    
    // Make the request to the GitHub API with pagination
    let allCommits = [];
    let page = 1;
    while (true) {
      const response = await axios.get(url, { 
        params: { ...params, page }, 
        headers 
      });
      allCommits = [...allCommits, ...response.data];
      if (response.data.length < 100) break;
      page++;
    }
    
    // Filter commits by date if needed
    let commits = allCommits;
    
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
      url: commit.htmlUrl
    }));
  }
  
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
      url: commit.htmlUrl,
      diff
    };
  }

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
        perPage: 100 // Maximum per page
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
                avatarUrl: commit.author?.avatarUrl
              },
              date: commit.commit.author.date,
              htmlUrl: commit.htmlUrl,
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
  }

  // Get specific commits by their IDs
  async getCommitsByIds({ accessToken, repository, commitIds }) {
    const headers = {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
    
    // Parallelize commit fetching with concurrency control
    const fetchCommitsInBatches = async (ids) => {
      const results = [];
      const batchSize = 5; // Adjust based on GitHub API rate limits
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const promises = batch.map(async (commitId) => {
          try {
            const url = `https://api.github.com/repos/${repository}/commits/${commitId}`;
            const response = await axios.get(url, { headers });
            
            // Format the commit
            console.log("files",response.data.files)
            return {
              sha: response.data.sha,
              message: response.data.commit.message,
              author: {
                login: response.data.committer?.login,
                avatarUrl: response.data.committer?.avatarUrl
              },
              date: response.data.commit.author.date,
              htmlUrl: response.data.commit.url,
              files: response.data.files ? response.data.files.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                diff: file.patch
              })) : []
            };
          } catch (error) {
            // Log error but continue with other commits
            console.error(`Failed to fetch commit ${commitId}: ${error.message}`);
            // Don't throw here as we want to continue with other commits
            return null;
          }
        });
        
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(Boolean));
      }
      
      return results;
    };
    
    try {
      // Fetch all commits in parallel with batching
      const commits = await fetchCommitsInBatches(commitIds);
      
      // Sort commits by date (newest first)
      commits.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return commits;
    } catch (error) {
      throw new ExternalServiceError(`GitHub API error fetching commits: ${error.message}`, 'GitHub');
    }
  }

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
            perPage: 1,
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
              perPage: 100,
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
  }
}

module.exports = new GitHubCommitService(); 