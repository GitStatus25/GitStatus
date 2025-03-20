import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import './PrivateRouteComponent.css';

const PrivateRouteComponentTemplate = ({ children, isLoading, isAuthenticated, location }) => {
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        className="auth-loading-container"
        sx={{
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Pass the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default PrivateRouteComponentTemplate;
