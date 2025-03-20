import axios from 'axios';

/**
 * Auth service to handle authentication related operations
 */
const authService = {
  /**
   * Clear all authentication data and redirect to login
   */
  handleAuthError: () => {
    console.log('Auth error handler called. Current location:', window.location.pathname);
    
    // Clear any auth data from localStorage if it exists
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Clear cookies with consideration for different paths/domains
    const cookieOptions = ['path=/', 'path=/api', 'domain=localhost', ''];
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      cookieOptions.forEach(option => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${option}`;
      });
    });
    
    // Check if we're already on the login page to avoid redirect loops
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth/callback')) {
      console.log('Redirecting to login page');
      // Redirect to login page
      window.location.href = '/login';
    } else {
      console.log('Not redirecting - already on login or callback page');
    }
  },
  
  /**
   * Set up axios interceptors for authentication
   * @param {Function} logoutFunction - Function to call for user logout
   */
  setupAxiosInterceptors: (logoutFunction) => {
    // Response interceptor
    axios.interceptors.response.use(
      response => response, // Return successful responses as-is
      error => {
        // Handle authentication errors (401 Unauthorized, 403 Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log('Authentication error detected:', error.response.status);
          console.log('URL that failed:', error.config.url);
          console.log('Current page:', window.location.pathname);
          
          // Log out the user
          if (logoutFunction) {
            try {
              logoutFunction();
            } catch (e) {
              console.error('Error during logout:', e);
            }
          }
          
          // Handle redirection and clear auth data
          authService.handleAuthError();
        }
        
        return Promise.reject(error);
      }
    );
  }
};

export default authService; 