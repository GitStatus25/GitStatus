import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Private route component to protect authenticated routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, checkAuth } = useContext(AuthContext);
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Recheck authentication when the component mounts or the route changes
  useEffect(() => {
    // Only check authentication if we're not already loading or checking
    if (!loading && !checkingAuth) {
      setCheckingAuth(true);
      checkAuth().finally(() => {
        setCheckingAuth(false);
      });
    }
  }, [location.pathname, checkAuth, loading, checkingAuth]);

  // Show loading spinner while checking authentication
  if (loading || checkingAuth) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("PrivateRoute: User not authenticated, redirecting to login");
    // Pass the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  console.log("PrivateRoute: User authenticated, rendering protected content");
  return children;
};

export default PrivateRoute;
