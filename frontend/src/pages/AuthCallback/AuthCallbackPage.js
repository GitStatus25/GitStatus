import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import AuthCallbackPageTemplate from './AuthCallbackPage.jsx';

/**
 * Auth callback page component - handles OAuth callback and redirections
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { checkAuth } = useContext(AuthContext);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        // Direct API call instead of using the checkAuth method to avoid interceptor issues
        const response = await axios.get('/api/auth/me');
        
        if (response.data.isAuthenticated) {
          // Get the redirect path from sessionStorage or default to dashboard
          const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard';
          
          // Clear the redirect path from sessionStorage
          sessionStorage.removeItem('redirectPath');
          
          // Redirect to the intended destination
          navigate(redirectPath, { replace: true });
        } else {
          setError("Authentication failed. Please try logging in again.");
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        setError("An error occurred during authentication. Please try again.");
        setTimeout(() => {
          navigate('/login?error=auth_failed', { replace: true });
        }, 2000);
      }
    };
    
    handleAuthentication();
  }, [navigate]);
  
  return <AuthCallbackPageTemplate error={error} />;
};

export default AuthCallbackPage;
