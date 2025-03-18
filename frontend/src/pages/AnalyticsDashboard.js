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

        {/* Usage Statistics */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Reports Generated"
            value={stats?.allTimeStats?.reports || 0}
            icon={<DescriptionIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            subtitle="All Time"
            tooltip="Total number of reports you've generated"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Commits Analyzed"
            value={stats?.allTimeStats?.commits || 0}
            icon={<CodeIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            subtitle="All Time"
            tooltip="Total number of commits you've analyzed"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Token Usage"
            value={stats?.allTimeStats?.tokenUsage?.toLocaleString() || 0}
            icon={<SpeedIcon sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            subtitle="All Time"
            tooltip="Total tokens used for AI processing"
          />
        </Grid>

        {/* Usage Limits */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: theme.palette.background.cardGradient,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <StorageIcon sx={{ mr: 1, color: theme.palette.info.main }} />
              Monthly Usage Limits
            </Typography>
            <Divider sx={{ my: 2 }} />
            <UsageProgress
              current={stats?.currentUsage?.reportsGenerated || 0}
              limit={stats?.plan?.limits?.reportsPerMonth || 50}
              label="Reports per Month"
              color={theme.palette.primary.main}
            />
            <UsageProgress
              current={stats?.currentUsage?.commitsAnalyzed || 0}
              limit={stats?.plan?.limits?.commitsPerMonth || 500}
              label="Commits per Month"
              color={theme.palette.success.main}
            />
          </Paper>
        </Grid>

        {/* Monthly Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: theme.palette.background.cardGradient,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
              This Month's Usage
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reports Generated
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.currentMonthStats?.reports?.total || 0}
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Commits Analyzed
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.currentMonthStats?.commits?.summarized || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Token Usage
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.currentMonthStats?.tokenUsage?.total?.toLocaleString() || 0}
              </Typography>
            </Box>
          </Paper>
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