import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Admin route component that redirects to dashboard if not admin
 */
const AdminRouteComponent = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.user?.role === 'admin',
    isLoading: state.isLoading
  }));
  
  // Show nothing while checking authentication status
  if (isLoading) {
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to dashboard if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render children if authenticated and admin
  return children;
};

export default AdminRouteComponent; 