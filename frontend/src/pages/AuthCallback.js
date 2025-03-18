import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

/**
 * Component to handle OAuth callback and redirections
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuth } = useContext(AuthContext);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        console.log("AuthCallback: Starting authentication check");
        
        // Direct API call instead of using the checkAuth method to avoid interceptor issues
        const response = await axios.get('/api/auth/me');
        console.log("AuthCallback: Auth check response:", response.data);
        
        if (response.data.isAuthenticated) {
          console.log("AuthCallback: User is authenticated");
          
          // Get the redirect path from sessionStorage or default to dashboard
          const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard';
          console.log("AuthCallback: Redirecting to", redirectPath);
          
          // Clear the redirect path from sessionStorage
          sessionStorage.removeItem('redirectPath');
          
          // Redirect to the intended destination
          navigate(redirectPath, { replace: true });
        } else {
          console.log("AuthCallback: User is not authenticated");
          setError("Authentication failed. Please try logging in again.");
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Authentication callback error:', error);
        setError("An error occurred during authentication. Please try again.");
        setTimeout(() => {
          navigate('/login?error=auth_failed', { replace: true });
        }, 2000);
      }
    };
    
    handleAuthentication();
  }, [navigate]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 3, maxWidth: "80%" }}>
          {error}
        </Alert>
      ) : null}
      
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 4 }}>
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthCallback; 