import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  LinearProgress,
  Divider,
  useTheme,
  Alert,
  Paper,
  Tooltip,
  IconButton,
  Zoom,
  Button
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
  AccountCircle as AccountCircleIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const StatCard = ({ title, value, icon, color, subtitle, tooltip }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.background.cardGradient,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}15`,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

const UsageProgress = ({ current, limit, label, color }) => {
  const percentage = (current / limit) * 100;
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {current} / {limit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: `${color}15`,
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 4,
          }
        }}
      />
      {percentage >= 90 && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <WarningIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="caption" color="warning.main">
            Approaching limit
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const AnalyticsDashboard = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.getUserStats();
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load usage statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Layout title="Analytics">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Analytics">
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4,
              p: 3,
              borderRadius: 2,
              background: theme.palette.background.cardGradient,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 48, mr: 2, color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Your Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your usage, monitor limits, and analyze your Git activity patterns
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Usage Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reports Generated
              </Typography>
              <Typography variant="h4">
                {stats?.allTimeStats?.reports || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commits Analyzed
              </Typography>
              <Typography variant="h4">
                {stats?.allTimeStats?.commits || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Usage
              </Typography>
              <Typography variant="h4">
                {stats?.allTimeStats?.tokenUsage?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Usage Limits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Usage Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Standard Reports
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, ((stats?.currentUsage?.reportsGenerated?.standard || 0) / (stats?.plan?.limits?.reportsPerMonth || 1)) * 100)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {`${stats?.currentUsage?.reportsGenerated?.standard || 0} / ${stats?.plan?.limits?.reportsPerMonth || 0} standard reports`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Up to {stats?.plan?.limits?.commitsPerStandardReport || 0} commits per report
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Large Reports
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, ((stats?.currentUsage?.reportsGenerated?.large || 0) / (Math.ceil((stats?.plan?.limits?.reportsPerMonth || 0) * 0.1))) * 100)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {`${stats?.currentUsage?.reportsGenerated?.large || 0} / ${Math.ceil((stats?.plan?.limits?.reportsPerMonth || 0) * 0.1)} large reports`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Up to {stats?.plan?.limits?.commitsPerLargeReport || 0} commits per report
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Breakdown */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                This Month's Usage
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Reports Generated
                  </Typography>
                  <Typography variant="h4">
                    {stats?.currentMonthStats?.reports?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.currentMonthStats?.reports?.standard || 0} standard, {stats?.currentMonthStats?.reports?.large || 0} large
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Commits Analyzed
                  </Typography>
                  <Typography variant="h4">
                    {stats?.currentMonthStats?.commits?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total commits this month
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Token Usage
                  </Typography>
                  <Typography variant="h4">
                    {stats?.currentMonthStats?.tokenUsage?.total?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.currentMonthStats?.tokenUsage?.input?.toLocaleString() || 0} input, {stats?.currentMonthStats?.tokenUsage?.output?.toLocaleString() || 0} output
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Commit Analysis */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 4,
              background: theme.palette.background.cardGradient,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.7) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)', // For Safari
                zIndex: 1
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  mr: 2
                }}>
                  <CodeIcon sx={{ mr: 2, fontSize: 28 }} />
                  Advanced Commit Analysis
                </Typography>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 1 }}>
                    Coming Soon
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                p: 3,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.03)'
              }}>
                <Typography variant="body1" sx={{ 
                  maxWidth: 600,
                  color: 'text.secondary',
                  lineHeight: 1.8
                }}>
                  Get ready for a powerful upgrade to your Git analytics! Soon you'll be able to:
                </Typography>
                <Box component="ul" sx={{ 
                  mt: 2,
                  pl: 2,
                  '& li': { 
                    color: 'text.secondary',
                    mb: 1,
                    lineHeight: 1.8
                  }
                }}>
                  <li>Uncover code complexity patterns and trends</li>
                  <li>Identify potential refactoring opportunities with AI assistance</li>
                  <li>Track detailed contribution metrics across your team</li>
                  <li>Generate AI-powered insights about your development workflow</li>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default AnalyticsDashboard; 