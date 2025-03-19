const githubService = require('../services/github');
const UsageStatsService = require('../services/usageStats');

// Get repositories info
exports.getRepositoryInfo = async (req, res) => {
  try {
    const { repository } = req.query;

    if (!repository) {
      return res.status(400).json({ message: 'Repository is required' });
    }

    const accessToken = req.user.accessToken;
    const repoInfo = await githubService.getRepositoryInfo({
      accessToken,
      repository
    });

    res.json(repoInfo);
  } catch (error) {
    console.error('Error getting repository info:', error);
    res.status(500).json({ message: 'Failed to get repository info', error: error.message });
  }
};

// Get branches for a repository
exports.getBranches = async (req, res) => {
  try {
    const { repository } = req.query;

    if (!repository) {
      return res.status(400).json({ message: 'Repository is required' });
    }

    const accessToken = req.user.accessToken;
    const branches = await githubService.getBranches({
      accessToken,
      repository
    });

    res.json(branches);
  } catch (error) {
    console.error('Error getting branches:', error);
    res.status(500).json({ message: 'Failed to get branches', error: error.message });
  }
};

// Get commits from GitHub
exports.getCommits = async (req, res) => {
  try {
    const { repository, branch, author, startDate, endDate } = req.query;

    if (!repository) {
      return res.status(400).json({ message: 'Repository is required' });
    }

    const accessToken = req.user.accessToken;
    const userId = req.user.id;
    
    const commits = await githubService.getCommits({
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
};

// Get contributors for a repository
exports.getContributors = async (req, res) => {
  try {
    const { repository } = req.query;

    if (!repository) {
      return res.status(400).json({ message: 'Repository is required' });
    }

    const accessToken = req.user.accessToken;
    const contributors = await githubService.getContributors({ accessToken, repository });

    res.json(contributors);
  } catch (error) {
    console.error('Error getting contributors:', error);
    res.status(500).json({ message: 'Failed to get contributors', error: error.message });
  }
};

// Get authors for specific branches in a repository
exports.getAuthorsForBranches = async (req, res) => {
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
    const authors = await githubService.getAuthorsForBranches({ 
      accessToken, 
      repository, 
      branches: branchesArray 
    });

    res.json(authors);
  } catch (error) {
    console.error('Error getting authors for branches:', error);
    res.status(500).json({ message: 'Failed to get authors for branches', error: error.message });
  }
};

// Get date range for branches and authors
exports.getDateRange = async (req, res) => {
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
    const dateRange = await githubService.getDateRangeForBranchesAndAuthors({ 
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
};

// Search for repositories
exports.searchRepositories = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const accessToken = req.user.accessToken;
    const repositories = await githubService.searchRepositoriesByName({ accessToken, query });

    res.json(repositories);
  } catch (error) {
    console.error('Error searching repositories:', error);
    res.status(500).json({ message: 'Failed to search repositories', error: error.message });
  }
};

// Get commits with files/diffs based on filters
exports.getCommitsWithDiffs = async (req, res) => {
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
    const commits = await githubService.getCommitsWithDiffs({
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
};

// Export all controller methods
module.exports = {
  getRepositoryInfo: exports.getRepositoryInfo,
  getBranches: exports.getBranches,
  getCommits: exports.getCommits,
  getContributors: exports.getContributors,
  searchRepositories: exports.searchRepositories,
  getAuthorsForBranches: exports.getAuthorsForBranches,
  getDateRange: exports.getDateRange,
  getCommitsWithDiffs: exports.getCommitsWithDiffs
};
