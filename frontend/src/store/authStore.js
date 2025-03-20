/**
 * Authentication Store using Zustand
 * 
 * Provides a global state management solution for authentication
 * with better performance and simpler API than Context.
 */
import { create } from 'zustand';
import axios from 'axios';
import authService from '../services/auth';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;  // Important for cookies/sessions

// Track if initialization is in progress to prevent multiple calls
let initializationInProgress = false;

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  
  /**
   * Initialize the store and set up interceptors
   */
  initialize: () => {
    // Prevent multiple initialization calls
    if (initializationInProgress) return;
    
    try {
      initializationInProgress = true;
      
      // Set up axios interceptors with our logout function
      authService.setupAxiosInterceptors(get().logout);
      
      // Check authentication on initialization
      get().checkAuth();
    } finally {
      // Ensure we reset the flag even if there's an error
      setTimeout(() => {
        initializationInProgress = false;
      }, 1000);
    }
  },
  
  /**
   * Check if user is authenticated with the backend
   * @returns {Promise<boolean>} Whether the authentication was successful
   */
  checkAuth: async () => {
    try {
      // Only update loading state if it's not already true
      if (!get().loading) {
        set({ loading: true });
      }
      
      const res = await axios.get('/api/auth/me');
      
      if (res.data.isAuthenticated) {
        // Only update if there's a change to prevent unnecessary rerenders
        if (!get().isAuthenticated || 
            !get().user || 
            get().user.id !== res.data.user.id) {
          set({
            user: res.data.user,
            isAuthenticated: true,
            error: null
          });
        }
        return true;
      } else {
        // Only update if there's a change
        if (get().isAuthenticated || get().user !== null) {
          set({
            user: null,
            isAuthenticated: false
          });
        }
        return false;
      }
    } catch (err) {
      // Only update if there's a change
      if (get().isAuthenticated || 
          get().user !== null || 
          get().error !== 'Failed to authenticate') {
        set({
          user: null,
          isAuthenticated: false,
          error: 'Failed to authenticate'
        });
      }
      return false;
    } finally {
      // Always set loading to false when done
      if (get().loading) {
        set({ loading: false });
      }
    }
  },
  
  /**
   * Logout the user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await axios.get('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Only update if there's an actual change
      if (get().isAuthenticated || get().user !== null) {
        set({
          user: null,
          isAuthenticated: false
        });
      }
    }
  }
}));

export default useAuthStore; 