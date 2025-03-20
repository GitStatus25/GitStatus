import axios from 'axios';
import errorHandler from '../utils/errorHandler';
import { addCsrfToken } from '../utils/csrf';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true; // Important for cookies/sessions

// Add request interceptor for CSRF tokens
axios.interceptors.request.use(
  async config => {
    // Only add CSRF token for state-changing methods
    const stateChangingMethods = ['post', 'put', 'delete', 'patch'];
    
    if (stateChangingMethods.includes(config.method)) {
      // Add CSRF token to headers
      const headers = await addCsrfToken(config.headers);
      config.headers = headers;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for centralized error handling
axios.interceptors.response.use(
  response => response,
  async error => {
    // Check if error is related to CSRF token
    if (error.response && error.response.status === 403 && 
        error.response.data && error.response.data.error === 'Invalid CSRF token') {
      // Handle CSRF token error by retrying the request (only once)
      if (!error.config._retryCount || error.config._retryCount < 1) {
        error.config._retryCount = (error.config._retryCount || 0) + 1;
        
        // Force fetch a new CSRF token
        const { fetchCsrfToken } = await import('../utils/csrf');
        await fetchCsrfToken();
        
        // Retry the request
        return axios(error.config);
      }
    }
    
    // Parse and standardize the error
    const parsedError = errorHandler.parseApiError(error);
    
    // Enhance error with our parsed data for easier handling
    error.parsedError = parsedError;
    
    // Still throw the error so it can be caught in the calling code
    throw error;
  }
);

/**
 * Generic API request handler with standardized error handling
 * 
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} - Resolved with data or rejected with standardized error
 */
const handleApiRequest = async (apiCall) => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    
    // If the error was already parsed by the interceptor, use that
    if (error.parsedError) {
      throw error.parsedError;
    }
    
    // Otherwise parse it now and throw the parsed version
    throw errorHandler.parseApiError(error);
  }
};

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
   * Helper function to format repository parameter
   * @param {string|Object} repository - Repository name or object
   * @returns {string} - Formatted repository string
   */
  _formatRepository: (repository) => {
    if (typeof repository === 'object' && repository.owner && repository.name) {
      return `${repository.owner}/${repository.name}`;
    }
    return repository;
  },

  /**
   * Get repository information
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   */
  getRepositoryInfo: async (repository) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/repository', { params: { repository: repoParam } });
      return response.data;
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw error;
    }
  },

  /**
   * Get branches for a repository
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   */
  getBranches: async (repository) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/branches', { params: { repository: repoParam } });
      return response.data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  /**
   * Get contributors for a repository
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   */
  getContributors: async (repository) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/contributors', { params: { repository: repoParam } });
      return response.data;
    } catch (error) {
      console.error('Error fetching contributors:', error);
      throw error;
    }
  },

  /**
   * Get authors for specific branches
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {Array<string>} branches - List of branch names
   */
  getAuthorsForBranches: async (repository, branches) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/branch-authors', {
        params: { 
          repository: repoParam,
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
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {Array<string>} branches - List of branch names
   * @param {Array<string>} authors - List of author names
   */
  getDateRange: async (repository, branches, authors) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/date-range', {
        params: { 
          repository: repoParam,
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
      repository: api._formatRepository(repository),
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
      repository: api._formatRepository(repository),
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
      const response = await axios.post('/api/commit-summary/details', params);
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
  },

  /**
   * Get user usage statistics
   */
  getUserStats: async () => {
    try {
      const response = await axios.get('/api/usage-stats/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  /**
   * Check if an operation would exceed rate limits
   * @param {Object} stats - Current usage statistics
   * @param {string} type - Type of operation ('reports', 'commits', 'tokens')
   * @param {number} amount - Amount to check
   * @returns {boolean} Whether operation would exceed limits
   */
  wouldExceedLimit: (stats, type, amount = 1) => {
    if (!stats?.plan?.limits) return true;

    const current = stats.currentUsage[
      type === 'reports' ? 'reportsGenerated' :
      type === 'commits' ? 'commitsAnalyzed' : 'tokensUsed'
    ] || 0;

    const limit = stats.plan.limits[`${type}PerMonth`];
    return (current + amount) > limit;
  },

  /**
   * Get remaining quota for a specific type
   * @param {Object} stats - Current usage statistics
   * @param {string} type - Type of operation ('reports', 'commits', 'tokens')
   * @returns {number} Remaining quota
   */
  getRemainingQuota: (stats, type) => {
    if (!stats?.plan?.limits) return 0;

    const current = stats.currentUsage[
      type === 'reports' ? 'reportsGenerated' :
      type === 'commits' ? 'commitsAnalyzed' : 'tokensUsed'
    ] || 0;

    const limit = stats.plan.limits[`${type}PerMonth`];
    return Math.max(0, limit - current);
  },

  // Plan management
  getPlans: () => axios.get('/api/plans').then(response => response.data),
  updatePlanLimits: (planId, limits) => 
    axios.put(`/api/plans/${planId}/limits`, { limits }).then(response => response.data),

  /**
   * Get PDF generation status
   * @param {string} reportId - Report ID
   * @returns {Promise} - API response with status information
   */
  getPdfStatus: async (reportId) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}/pdf-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting PDF status:', error);
      throw error;
    }
  },
};

export default api;
