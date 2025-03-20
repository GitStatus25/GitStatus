import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useShallow } from 'zustand/react/shallow'; 
/**
 * Admin route component that redirects to dashboard if not admin
 */
const AdminRouteComponent = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuthStore(useShallow(state => ({
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.user?.role === 'admin',
    loading: state.loading
  })));
  
  // Show nothing while checking authentication status
  if (loading) {
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