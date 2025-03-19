import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import './AdminRouteComponent.css';

const AdminRouteComponentTemplate = ({ children, isLoading, isAuthenticated, isAdmin, location }) => {
  if (isLoading) {
    return (
      <Box
        className="admin-loading-container"
        sx={{
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRouteComponentTemplate;
