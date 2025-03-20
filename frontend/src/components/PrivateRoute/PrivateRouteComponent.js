import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Private route component that redirects to login if not authenticated
 */
const PrivateRouteComponent = ({ children }) => {
  // Use local state to prevent unnecessary re-renders
  const [authState, setAuthState] = useState({
    isAuthenticated: useAuthStore.getState().isAuthenticated,
    loading: useAuthStore.getState().loading
  });
  
  // Subscribe to store changes
  useEffect(() => {
    // Get initial state
    const initialState = {
      isAuthenticated: useAuthStore.getState().isAuthenticated,
      loading: useAuthStore.getState().loading
    };
    setAuthState(initialState);
    
    // Subscribe to store changes
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        // Only update if values have changed to prevent unnecessary renders
        if (state.isAuthenticated !== authState.isAuthenticated || 
            state.loading !== authState.loading) {
          setAuthState({
            isAuthenticated: state.isAuthenticated,
            loading: state.loading
          });
        }
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Show nothing while checking authentication status
  if (authState.loading) {
    return null;
  }
  
  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Render children if authenticated
  return children;
};

export default PrivateRouteComponent; 