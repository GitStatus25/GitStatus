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
            value={stats?.currentUsage?.reportsGenerated || 0}
            icon={<DescriptionIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            subtitle="This Month"
            tooltip="Number of reports you've generated this month"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Commits Analyzed"
            value={stats?.currentUsage?.commitsAnalyzed || 0}
            icon={<CodeIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            subtitle="This Month"
            tooltip="Number of commits you've analyzed this month"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Token Usage"
            value={stats?.monthlyStats?.tokenUsage?.total?.toLocaleString() || 0}
            icon={<SpeedIcon sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            subtitle="This Month"
            tooltip="Total tokens used for AI processing this month"
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
              Usage Limits
            </Typography>
            <Divider sx={{ my: 2 }} />
            <UsageProgress
              current={stats?.currentUsage?.reportsGenerated || 0}
              limit={stats?.limits?.reportsPerMonth || 50}
              label="Reports per Month"
              color={theme.palette.primary.main}
            />
            <UsageProgress
              current={stats?.currentUsage?.commitsAnalyzed || 0}
              limit={stats?.limits?.commitsPerMonth || 500}
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
              Monthly Breakdown
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reports Generated
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.monthlyStats?.reports?.total || 0}
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Commits Analyzed
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.monthlyStats?.commits?.summarized || 0}
              </Typography>
            </Box>
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backdropFilter: 'blur(8px)',
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Advanced Commit Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Coming in Phase 2
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  href="https://github.com/yourusername/GitStatus/issues/1"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: 'rgba(77, 171, 245, 0.08)',
                    }
                  }}
                >
                  View on GitHub
                </Button>
              </Box>
              <Box sx={{ opacity: 0.3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Advanced Metrics
                </Typography>
                <Typography variant="h4" component="div">
                  Coming Soon
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default AnalyticsDashboard; 