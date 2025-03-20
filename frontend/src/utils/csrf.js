/**
 * CSRF Token Utility Functions
 * Provides helpers for working with CSRF token in API requests
 */

// Store token in memory
let csrfToken = null;
let tokenTimestamp = 0;
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Fetch a CSRF token from the server
 * @returns {Promise<string>} The CSRF token
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include', // Important: include cookies
      cache: 'no-store', // Prevent caching
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    tokenTimestamp = Date.now();
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

/**
 * Get the current CSRF token, fetching a new one if necessary
 * @param {boolean} forceRefresh - Force a token refresh
 * @returns {Promise<string>} The CSRF token
 */
export const getCsrfToken = async (forceRefresh = false) => {
  const tokenAge = Date.now() - tokenTimestamp;
  
  // Fetch a new token if any of these conditions are true:
  // 1. No token exists
  // 2. Token is expired
  // 3. Force refresh is requested
  if (!csrfToken || tokenAge > TOKEN_EXPIRY || forceRefresh) {
    return fetchCsrfToken();
  }
  
  return csrfToken;
};

/**
 * Add CSRF token to the provided headers object
 * @param {Object} headers - Headers object to add the token to
 * @param {boolean} forceRefresh - Force a token refresh
 * @returns {Promise<Object>} Headers object with CSRF token
 */
export const addCsrfToken = async (headers = {}, forceRefresh = false) => {
  const token = await getCsrfToken(forceRefresh);
  return {
    ...headers,
    // Try both header formats to ensure compatibility
    'x-csrf-token': token,
    'csrf-token': token
  };
};

/**
 * Enhanced fetch function that automatically adds CSRF token
 * for state-changing methods (POST, PUT, DELETE, PATCH)
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCsrf = async (url, options = {}) => {
  const { method = 'GET', headers = {}, ...rest } = options;
  
  // Only add CSRF token for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  let requestHeaders = headers;
  if (stateChangingMethods.includes(method.toUpperCase())) {
    // Always get a fresh token for state-changing methods
    requestHeaders = await addCsrfToken(headers, true);
  }
  
  return fetch(url, {
    method,
    headers: requestHeaders,
    credentials: 'include', // Always include cookies
    ...rest,
  });
};

export default {
  fetchCsrfToken,
  getCsrfToken,
  addCsrfToken,
  fetchWithCsrf,
}; 