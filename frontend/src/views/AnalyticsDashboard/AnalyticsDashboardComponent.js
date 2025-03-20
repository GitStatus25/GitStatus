import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import AnalyticsDashboardComponentTemplate from './AnalyticsDashboardComponent.jsx';
import useAuthStore from '../../store/authStore';
import useUserStats from '../../hooks/useUserStats';
import { useShallow } from 'zustand/react/shallow';

const AnalyticsDashboardComponent = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, loading: authLoading } = useAuthStore(useShallow(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated, 
    loading: state.loading
  })));
  
  const { userStats: stats, loading, error, refetch } = useUserStats();

  useEffect(() => {
    // If authentication is complete and user is not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/analytics' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
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
