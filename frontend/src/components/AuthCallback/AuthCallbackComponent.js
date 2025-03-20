import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import axios from 'axios';
import AuthCallbackComponentTemplate from './AuthCallbackComponent.jsx';

/**
 * Auth callback component - handles OAuth callback and redirections
 */
const AuthCallbackComponent = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        // Direct API call instead of using the checkAuth method to avoid interceptor issues
        const response = await axios.get('/api/auth/me');
        
        if (response.data.isAuthenticated) {
          // Update auth store directly instead of re-initializing
          useAuthStore.setState({
            user: response.data.user,
            isAuthenticated: true,
            error: null,
            loading: false
          });
          
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
  
  return <AuthCallbackComponentTemplate error={error} />;
};

export default AuthCallbackComponent;
