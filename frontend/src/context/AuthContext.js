import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  axios.defaults.withCredentials = true;  // Important for cookies/sessions

  // Check if user is authenticated
  const checkAuth = async () => {
    console.log("AuthContext: Checking authentication");
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/me');
      console.log("AuthContext: Auth check response:", res.data);
      
      if (res.data.isAuthenticated) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        console.log("AuthContext: User is authenticated");
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log("AuthContext: User is not authenticated");
      }
      
      setError(null);
      return res.data;
    } catch (err) {
      console.error('Authentication check failed:', err);
      setUser(null);
      setIsAuthenticated(false);
      setError('Failed to authenticate. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.get('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout. Please try again.');
    } finally {
      // Even if the logout API call fails, we still clear the local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Set up axios interceptors for authentication
  useEffect(() => {
    // Setup axios interceptors with our logout function
    authService.setupAxiosInterceptors(logout);
  }, []);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Auth context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    checkAuth,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
