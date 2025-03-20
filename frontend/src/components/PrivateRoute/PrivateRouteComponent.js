import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Private route component that redirects to login if not authenticated
 */
const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  // Show loading while auth status is being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Render children if authenticated
  return children;
};

export default PrivateRouteComponent; 