import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute; 