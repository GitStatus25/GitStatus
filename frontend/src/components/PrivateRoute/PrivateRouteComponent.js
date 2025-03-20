import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Private route component that redirects to login if not authenticated
 */
const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    loading: state.loading
  }));
  
  // Show nothing while checking authentication status
  if (loading) {
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Render children if authenticated
  return children;
};

export default PrivateRouteComponent; 