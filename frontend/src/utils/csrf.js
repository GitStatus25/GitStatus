/**
 * CSRF Token Utility Functions
 * Provides helpers for working with CSRF token in API requests
 */

// Store token in memory
let csrfToken = null;

/**
 * Fetch a CSRF token from the server
 * @returns {Promise<string>} The CSRF token
 */
export const fetchCsrfToken = async () => {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include', // Important: include cookies
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
};

/**
 * Get the current CSRF token, fetching a new one if necessary
 * @returns {Promise<string>} The CSRF token
 */
export const getCsrfToken = async () => {
  if (!csrfToken) {
    return fetchCsrfToken();
  }
  return csrfToken;
};

/**
 * Add CSRF token to the provided headers object
 * @param {Object} headers - Headers object to add the token to
 * @returns {Promise<Object>} Headers object with CSRF token
 */
export const addCsrfToken = async (headers = {}) => {
  const token = await getCsrfToken();
  return {
    ...headers,
    'csrf-token': token,
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
    requestHeaders = await addCsrfToken(headers);
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