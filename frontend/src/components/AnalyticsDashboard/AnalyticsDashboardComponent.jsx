import React from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  LinearProgress,
  Divider,
  Alert,
  Paper,
  Tooltip,
  IconButton,
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
import Layout from '../PagePartials/Layout';
import './AnalyticsDashboardComponent.css';
import ComingSoonFeatureComponent from '../PagePartials/ComingSoonFeature/ComingSoonFeatureComponent';

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle, tooltip }) => {
  return (
    <Card className="stat-card" sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Box className="stat-card-header">
          <Box 
            className="stat-card-icon-container"
            sx={{ bgcolor: `${color}15` }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div" className="stat-card-title">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" className="stat-card-subtitle">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="h4" component="div" className="stat-card-value">
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

// Usage Progress Component
const UsageProgress = ({ current, limit, label, color }) => {
  const percentage = (current / limit) * 100;

  return (
    <Box className="usage-progress-container">
      <Box className="usage-progress-header">
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
        className="usage-progress-bar"
        sx={{
          bgcolor: `${color}15`,
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
          }
        }}
      />
      {percentage >= 90 && (
        <Box className="usage-warning">
          <WarningIcon color="warning" fontSize="small" className="usage-warning-icon" />
          <Typography variant="caption" color="warning.main">
            Approaching limit
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const AnalyticsDashboardComponentTemplate = ({ loading, error, stats, theme }) => {
  if (loading) {
    return (
      <Layout title="Analytics">
        <Box className="loading-container">
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
      <Box className="dashboard-container">
        <Grid container spacing={3}>
          {/* Welcome Section */}
          <Grid item xs={12}>
            <Box 
              className="welcome-section"
              sx={{ 
                background: theme?.palette?.background?.cardGradient,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <AccountCircleIcon className="welcome-icon" sx={{ color: theme?.palette?.primary?.main }} />
              <Box>
                <Typography variant="h4" component="h1" className="welcome-title">
                  Your Analytics Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" className="welcome-subtitle">
                  Track your usage, monitor limits, and analyze your Git activity patterns
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Key Stats */}
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Reports Generated" 
              value={stats?.allTimeStats?.reports || 0} 
              icon={<DescriptionIcon sx={{ color: theme?.palette?.primary?.main }} />}
              color={theme?.palette?.primary?.main}
              subtitle="All-time total"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Commits Analyzed" 
              value={stats?.allTimeStats?.commits || 0} 
              icon={<CodeIcon sx={{ color: theme?.palette?.secondary?.main }} />}
              color={theme?.palette?.secondary?.main}
              subtitle="All-time total"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Tokens Spent" 
              value={stats?.allTimeStats?.tokenUsage ? `${(stats.allTimeStats.tokenUsage)}` : 'N/A'} 
              icon={<StorageIcon sx={{ color: theme?.palette?.info?.main }} />}
              color={theme?.palette?.info?.main}
              subtitle="All-time total"
            />
          </Grid>

          {/* Plan Info */}
          <Grid item xs={12}>
            <Paper 
              className="plan-info-section"
              sx={{ 
                background: theme?.palette?.background?.cardGradient,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box className="plan-header">
                <Typography variant="h6" className="section-title">
                  Your Plan: <span className="plan-name">{stats?.plan?.displayName || 'Basic'}</span>
                </Typography>
                {stats?.plan?.name !== 'enterprise' && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="primary"
                    sx={{ ml: 2 }}
                  >
                    Upgrade
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="sub-section">
                    Monthly Usage
                  </Typography>
                  <UsageProgress 
                    current={stats?.currentMonthStats?.reports?.standard || 0} 
                    limit={stats?.plan?.limits?.reportsPerMonth || 10}
                    label="Standard Reports"
                    color={theme?.palette?.primary?.main}
                  />
                  <UsageProgress 
                    current={stats?.currentMonthStats?.reports?.large || 0} 
                    limit={Math.floor((stats?.plan?.limits?.reportsPerMonth || 10) * 0.1)}
                    label="Large Reports"
                    color={theme?.palette?.secondary?.main}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="sub-section">
                    Report Limits
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Standard Report:</strong> Up to {stats?.plan?.limits?.commitsPerStandardReport || 20} commits
                    </Typography>
                    <Typography variant="body2">
                      <strong>Large Report:</strong> Up to {stats?.plan?.limits?.commitsPerLargeReport || 50} commits
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Commit Analysis */}
          <Grid item xs={12}>
              <ComingSoonFeatureComponent 
                title="Commit Analysis" 
              />
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default AnalyticsDashboardComponentTemplate;
