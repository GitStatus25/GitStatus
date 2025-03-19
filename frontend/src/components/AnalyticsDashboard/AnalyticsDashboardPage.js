import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import AnalyticsDashboardComponentTemplate from './AnalyticsDashboardComponent.jsx';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AnalyticsDashboardComponent = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If authentication is complete and user is not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/analytics' } });
      return;
    }

    // Fetch user stats if authenticated
    if (isAuthenticated && user) {
      fetchUserStats();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load analytics data. Please try again later.'
      );
      enqueueSnackbar('Failed to load analytics data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchUserStats();
    enqueueSnackbar('Refreshing analytics data...', { variant: 'info' });
  };

  return (
    <AnalyticsDashboardComponentTemplate
      loading={loading || authLoading}
      error={error}
      stats={stats}
      theme={theme}
      onRefresh={handleRefresh}
    />
  );
};

export default AnalyticsDashboardComponent;
