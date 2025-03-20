import axios from 'axios';
import errorHandler from '../utils/errorHandler';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true; // Important for cookies/sessions

// Add request interceptor for CSRF tokens
axios.interceptors.request.use(
  async config => {
    // Only add CSRF token for state-changing methods
    const stateChangingMethods = ['post', 'put', 'delete', 'patch'];
    
    if (stateChangingMethods.includes(config.method)) {
      
      // Always fetch a fresh token for state-changing requests
      const { fetchCsrfToken } = await import('../utils/csrf');
      await fetchCsrfToken();
      
      // Add CSRF token to headers with force refresh
      const { addCsrfToken } = await import('../utils/csrf');
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

// Create a helper function to create AbortController and wrap API calls
export const createApiRequestWithAbortController = (apiMethod) => {
  const controller = new AbortController();
  
  const wrappedMethod = (...args) => {
    return apiMethod(...args, controller.signal);
  };
  
  wrappedMethod.abort = () => {
    controller.abort();
  };
  
  return wrappedMethod;
};

const api = {
  /**
   * Get the currently authenticated user
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getCurrentUser: async (signal) => {
    const response = await axios.get('/api/auth/me', { signal });
    return response.data;
  },

  /**
   * Logout the current user
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  logout: async (signal) => {
    const response = await axios.get('/api/auth/logout', { signal });
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
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getRepositoryInfo: async (repository, signal) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/repository', { 
        params: { repository: repoParam },
        signal 
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching repository info:', error);
      throw error;
    }
  },

  /**
   * Get branches for a repository
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getBranches: async (repository, signal) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/branches', { 
        params: { repository: repoParam },
        signal 
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  /**
   * Get contributors for a repository
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getContributors: async (repository, signal) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/contributors', { 
        params: { repository: repoParam },
        signal 
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching contributors:', error);
      throw error;
    }
  },

  /**
   * Get authors for specific branches
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {Array<string>} branches - List of branch names
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getAuthorsForBranches: async (repository, branches, signal) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/branch-authors', {
        params: { 
          repository: repoParam,
          branches
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching authors for branches:', error);
      throw error;
    }
  },

  /**
   * Get date range for branches and authors
   * @param {string|Object} repository - Repository name in format 'owner/repo' or repository object
   * @param {Array<string>} branches - List of branch names
   * @param {Array<string>} authors - List of author names
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getDateRange: async (repository, branches, authors, signal) => {
    try {
      const repoParam = api._formatRepository(repository);
      const response = await axios.get('/api/commits/date-range', {
        params: { 
          repository: repoParam,
          branches,
          authors
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
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
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   * @param {Function} [onProgress] - Optional callback for tracking request progress
   * @returns {Promise<Object>} - Commits data or canceled status
   */
  getCommits: async (params, signal, onProgress) => {
    // Request state tracking
    let requestState = {
      inProgress: true,
      startTime: Date.now(),
      completed: false,
      aborted: false,
      error: null
    };
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress({ type: 'started', ...requestState });
    }
    
    try {
      const response = await axios.get('/api/commits', { params, signal });
      
      // Update request state
      requestState.completed = true;
      requestState.data = response.data;
      
      if (onProgress) {
        onProgress({ type: 'completed', ...requestState });
      }
      
      return response.data;
    } catch (error) {
      // Update request state
      requestState.error = error;
      
      if (axios.isCancel(error)) {
        requestState.aborted = true;
        console.log('Request canceled:', error.message);
        
        if (onProgress) {
          onProgress({ type: 'aborted', ...requestState });
        }
        
        return { canceled: true };
      }
      
      if (onProgress) {
        onProgress({ type: 'error', ...requestState });
      }
      
      console.error('Error fetching commits:', error);
      throw error;
    } finally {
      // Always mark the request as no longer in progress
      requestState.inProgress = false;
      requestState.endTime = Date.now();
      requestState.duration = requestState.endTime - requestState.startTime;
      
      // Perform cleanup that should happen regardless of outcome
      if (onProgress && !requestState.aborted) {
        onProgress({ type: 'finished', ...requestState });
      }
      
      // Example cleanup code - in real app, might clean up resources or UI state
      console.log(`Request ${requestState.aborted ? 'aborted' : (requestState.completed ? 'completed' : 'failed')} after ${requestState.duration}ms`);
    }
  },

  /**
   * Get commits based on repository, branches, authors, and date range
   * @param {Object} params - Filter parameters
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getCommitsByFilters: async ({ repository, branches, authors, startDate, endDate }, signal) => {
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
    
    const response = await axios.get('/api/commits/with-diffs', { params, signal });
    return response.data;
  },

  /**
   * Generate a report with the selected commits
   * @param {Object} reportData - Report data
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  generateReport: async ({ repository, branches, authors, startDate, endDate, title, includeCode, commitIds }, signal) => {
    const response = await axios.post('/api/reports', {
      repository: api._formatRepository(repository),
      branches,
      authors,
      startDate,
      endDate,
      title,
      includeCode,
      commitIds
    }, { signal });
    return response.data;
  },

  /**
   * Get all reports for the current user
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getReports: async (signal) => {
    const response = await axios.get('/api/reports', { signal });
    return response.data;
  },

  /**
   * Get a specific report by ID
   * @param {string} id - Report ID
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getReportById: async (id, signal) => {
    const response = await axios.get(`/api/reports/${id}`, { signal });
    return response.data;
  },

  /**
   * Delete a report by ID
   * @param {string} id - Report ID
   * @param {string} confirmationName - Name of the report (for confirmation)
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  deleteReport: async (id, confirmationName, signal) => {
    try {
      const response = await axios.delete(`/api/reports/${id}`, {
        data: { confirmationName },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  /**
   * Search for repositories based on a query string
   * @param {string} query - Search query
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   * @returns {Promise<Array>} - List of matching repositories
   */
  searchRepositories: async (query, signal) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    try {
      const response = await axios.get('/api/commits/search-repositories', {
        params: { query },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error searching repositories:', error);
      throw error;
    }
  },

  /**
   * Get commit info with branch details
   * @param {object} params - Parameters for commit info request
   * @param {string} params.repository - Repository path (owner/repo)
   * @param {Array} params.commitIds - Array of commit IDs
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getCommitInfo: async (params, signal) => {
    try {
      const response = await axios.post('/api/reports/commit-info', params, { signal });
      return response.data.commits;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error getting commit info:', error);
      throw error;
    }
  },

  /**
   * Get commit details including author and summary from commit summaries
   * @param {object} params - Parameters for commit details request
   * @param {string} params.repository - Repository path (owner/repo)
   * @param {Array} params.commitIds - Array of commit IDs
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getCommitDetails: async (params, signal) => {
    try {
      const response = await axios.post('/api/commit-summary/details', params, { signal });
      return response.data.commits;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error getting commit details:', error);
      throw error;
    }
  },

  /**
   * Get all users (admin only)
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getUsers: async (signal) => {
    try {
      const response = await axios.get('/api/admin/users', { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Update user role (admin only)
   * @param {string} userId - User ID
   * @param {string} role - New role (user/admin)
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  updateUserRole: async (userId, role, signal) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role }, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * Get admin analytics data
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getAdminAnalytics: async (signal) => {
    try {
      const response = await axios.get('/api/admin/analytics', { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  },

  /**
   * Get user usage statistics
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  getUserStats: async (signal) => {
    try {
      const response = await axios.get('/api/usage-stats/user', { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
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
  getPlans: async (signal) => {
    try {
      const response = await axios.get('/api/admin/plans', { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  /**
   * Update user plan (admin only)
   * @param {string} userId - User ID
   * @param {string} plan - New plan (free/professional/enterprise)
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  updateUserPlan: async (userId, plan, signal) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/plan`, { plan }, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error updating user plan:', error);
      throw error;
    }
  },

  /**
   * Create a new plan (admin only)
   * @param {Object} planData - Plan data 
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  createPlan: async (planData, signal) => {
    try {
      const response = await axios.post('/api/admin/plans', planData, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  /**
   * Update an existing plan (admin only)
   * @param {string} planId - Plan ID
   * @param {Object} planData - Updated plan data
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   */
  updatePlan: async (planId, planData, signal) => {
    try {
      const response = await axios.put(`/api/admin/plans/${planId}`, planData, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  /**
   * Get PDF generation status
   * @param {string} reportId - Report ID
   * @param {AbortSignal} [signal] - Optional AbortSignal for request cancellation
   * @returns {Promise} - API response with status information
   */
  getPdfStatus: async (reportId, signal) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}/pdf-status`, { signal });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        return { canceled: true };
      }
      console.error('Error getting PDF status:', error);
      throw error;
    }
  },
};

export default api;
