import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import LoginPageTemplate from './LoginPage.jsx';

/**
 * Login page component - contains only business logic
 */
const LoginPage = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Get the path to redirect to after login
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  // Get error message from URL if it exists
  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get('error');

  const handleGitHubLogin = () => {
    // Store the redirect path in sessionStorage to use after OAuth redirect
    sessionStorage.setItem('redirectPath', from);
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/github`;
  };

  // Pass all props to the template component
  return (
    <LoginPageTemplate
      error={error}
      handleGitHubLogin={handleGitHubLogin}
      theme={theme}
    />
  );
};

export default LoginPage;
