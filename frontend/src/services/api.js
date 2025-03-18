import axios from 'axios';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true; // Important for cookies/sessions

const api = {
  /**
   * Get the currently authenticated user
   */
  getCurrentUser: async () => {
    const response = await axios.get('/api/auth/me');
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async () => {
    const response = await axios.get('/api/auth/logout');
    return response.data;
  },

  /**
   * Get repository information
   * @param {string} repository - Repository name in format 'owner/repo'
   */
  getRepositoryInfo: async (repository) => {
    try {
      const response = await axios.get('/api/commits/repository', { params: { repository } });
      return response.data;
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw error;
    }
  },

  /**
   * Get branches for a repository
   * @param {string} repository - Repository name in format 'owner/repo'
   */
  getBranches: async (repository) => {
    try {
      const response = await axios.get('/api/commits/branches', { params: { repository } });
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  /**
   * Get contributors for a repository
   * @param {string} repository - Repository name in format 'owner/repo'
   */
  getContributors: async (repository) => {
    try {
      const response = await axios.get('/api/commits/contributors', { params: { repository } });
      return response.data;
    } catch (error) {
      console.error('Error fetching contributors:', error);
      throw error;
    }
  },

  /**
   * Get authors for specific branches
   * @param {string} repository - Repository name in format 'owner/repo'
   * @param {Array<string>} branches - List of branch names
   */
  getAuthorsForBranches: async (repository, branches) => {
    try {
      const response = await axios.get('/api/commits/branch-authors', {
        params: { 
          repository,
          branches
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching authors for branches:', error);
      throw error;
    }
  },

  /**
   * Get date range for branches and authors
   * @param {string} repository - Repository name in format 'owner/repo'
   * @param {Array<string>} branches - List of branch names
   * @param {Array<string>} authors - List of author names
   */
  getDateRange: async (repository, branches, authors) => {
    try {
      const response = await axios.get('/api/commits/date-range', {
        params: { 
          repository,
          branches,
          authors
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching date range:', error);
      throw error;
    }
  },

  /**
   * Get commits for a repository with filters
   * @param {Object} params - Query parameters
   * @param {string} params.repository - Repository name in format 'owner/repo'
   * @param {string} [params.branch] - Branch name
   * @param {string} [params.author] - Author login
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   */
  getCommits: async (params) => {
    try {
      const response = await axios.get('/api/commits', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  },

  /**
   * Get commits based on repository, branches, authors, and date range
   */
  getCommitsByFilters: async ({ repository, branches, authors, startDate, endDate }) => {
    const params = {
      repository,
      branches: branches.join(','),
      includeFiles: true // Include file diffs in the response
    };
    
    if (authors && authors.length > 0) {
      params.authors = authors.join(',');
    }
    
    if (startDate) {
      params.startDate = startDate;
    }
    
    if (endDate) {
      params.endDate = endDate;
    }
    
    const response = await axios.get('/api/commits/with-diffs', { params });
    return response.data;
  },

  /**
   * Generate a report with the selected commits
   */
  generateReport: async ({ repository, branches, authors, startDate, endDate, title, includeCode, commitIds }) => {
    const response = await axios.post('/api/reports', {
      repository,
      branches,
      authors,
      startDate,
      endDate,
      title,
      includeCode,
      commitIds
    });
    return response.data;
  },

  /**
   * Get all reports for the current user
   */
  getReports: async () => {
    const response = await axios.get('/api/reports');
    return response.data;
  },

  /**
   * Get a specific report by ID
   * @param {string} id - Report ID
   */
  getReportById: async (id) => {
    const response = await axios.get(`/api/reports/${id}`);
    return response.data;
  },

  /**
   * Delete a report by ID
   * @param {string} id - Report ID
   * @param {string} confirmationName - Name of the report (for confirmation)
   */
  deleteReport: async (id, confirmationName) => {
    try {
      const response = await axios.delete(`/api/reports/${id}`, {
        data: { confirmationName }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  /**
   * Search for repositories based on a query string
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of matching repositories
   */
  searchRepositories: async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    try {
      const response = await axios.get('/api/commits/search-repositories', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  },

  /**
   * Get commit info with branch details
   * @param {object} params - Parameters for commit info request
   * @param {string} params.repository - Repository path (owner/repo)
   * @param {Array} params.commitIds - Array of commit IDs
   */
  getCommitInfo: async (params) => {
    try {
      const response = await axios.post('/api/reports/commit-info', params);
      return response.data.commits;
    } catch (error) {
      console.error('Error getting commit info:', error);
      throw error;
    }
  },

  /**
   * Get commit details including author and summary from commit summaries
   * @param {object} params - Parameters for commit details request
   * @param {string} params.repository - Repository path (owner/repo)
   * @param {Array} params.commitIds - Array of commit IDs
   */
  getCommitDetails: async (params) => {
    try {
      const response = await axios.post('/api/commit-summaries/details', params);
      return response.data.commits;
    } catch (error) {
      console.error('Error getting commit details:', error);
      throw error;
    }
  },

  /**
   * Get all users (admin only)
   */
  getUsers: async () => {
    try {
      const response = await axios.get('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Update user role (admin only)
   * @param {string} userId - The user ID
   * @param {string} role - The new role ('user' or 'admin')
   */
  updateUserRole: async (userId, role) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * Get admin analytics (admin only)
   */
  getAdminAnalytics: async () => {
    try {
      const response = await axios.get('/api/admin/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }
};

export default api;
