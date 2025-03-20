import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Admin route component that redirects to dashboard if not admin
 */
const AdminRouteComponent = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuthStore();
  
  // Show loading while auth status is being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Redirect to dashboard if authenticated but not admin
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  // Render children if authenticated and admin
  return children;
};

export default AdminRouteComponent; 