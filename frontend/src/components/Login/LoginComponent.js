import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import LoginComponentTemplate from './LoginComponent.jsx';

/**
 * Login page component - contains only business logic
 */
const LoginComponent = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/github`;
  };

  return (
    <LoginComponentTemplate
      handleGitHubLogin={handleGitHubLogin}
      theme={theme}
    />
  );
};

export default LoginComponent;
