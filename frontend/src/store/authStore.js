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

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  
  /**
   * Initialize the store and set up interceptors
   */
  initialize: () => {
    // Set up axios interceptors with our logout function
    authService.setupAxiosInterceptors(get().logout);
    // Check authentication on initialization
    get().checkAuth();
  },
  
  /**
   * Check if user is authenticated with the backend
   * @returns {Promise<boolean>} Whether the authentication was successful
   */
  checkAuth: async () => {
    try {
      set({ loading: true });
      const res = await axios.get('/api/auth/me');
      
      if (res.data.isAuthenticated) {
        set({
          user: res.data.user,
          isAuthenticated: true,
          error: null
        });
        return true;
      } else {
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
        return false;
      }
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        error: 'Failed to authenticate'
      });
      return false;
    } finally {
      set({ loading: false });
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
      set({
        user: null,
        isAuthenticated: false
      });
    }
  }
}));

export default useAuthStore; 