import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import './AdminDashboardComponent.css';

const AdminDashboardComponentTemplate = ({
  user,
  users,
  selectedUser,
  newRole,
  message,
  loading,
  analytics,
  plans,
  selectedPlan,
  planLimits,
  onUserSelect,
  onRoleChange,
  onRoleUpdate,
  onPlanSelect,
  onLimitChange,
  onLimitsUpdate
}) => {
  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Container>
    );
  }

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  return (
    <Container maxWidth="lg" className="admin-dashboard-container">
      <Typography variant="h4" className="admin-dashboard-title">
        Admin Dashboard
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Management Section */}
        <Grid item xs={12} md={6}>
          <Paper className="admin-section">
            <Typography variant="h6" className="admin-section-title">
              User Management
            </Typography>
            
            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.username} (${option.role})`}
              value={selectedUser}
              onChange={onUserSelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  variant="outlined"
                  className="form-field"
                />
              )}
            />

            <TextField
              select
              fullWidth
              label="New Role"
              value={newRole}
              onChange={onRoleChange}
              SelectProps={{
                native: true,
              }}
              className="form-field"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </TextField>

            <Button
              variant="contained"
              onClick={onRoleUpdate}
              disabled={!selectedUser || loading}
              className="action-button"
            >
              {loading ? <CircularProgress size={24} /> : 'Update Role'}
            </Button>
          </Paper>
        </Grid>

        {/* Plan Management Section */}
        <Grid item xs={12} md={6}>
          <Paper className="admin-section">
            <Typography variant="h6" className="admin-section-title">
              Plan Management
            </Typography>
            
            <Autocomplete
              options={plans}
              getOptionLabel={(option) => `${option.displayName} (${option.name})`}
              value={selectedPlan}
              onChange={onPlanSelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Plan"
                  variant="outlined"
                  className="form-field"
                />
              )}
            />

            {selectedPlan && (
              <>
                <Typography variant="subtitle1" className="admin-section-subtitle">
                  Report Limits
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Reports per Month"
                  value={planLimits.reportsPerMonth}
                  onChange={(e) => onLimitChange('reportsPerMonth', e.target.value)}
                  className="form-field"
                  helperText="This determines the number of standard reports allowed per month"
                />
                <Typography variant="body2" color="text.secondary" className="form-info">
                  Large reports allowed: {Math.floor(planLimits.reportsPerMonth * 0.1)}
                </Typography>

                <Typography variant="subtitle1" className="admin-section-subtitle">
                  Commits per Report
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Commits per Standard Report"
                  value={planLimits.commitsPerStandardReport}
                  onChange={(e) => onLimitChange('commitsPerStandardReport', e.target.value)}
                  className="form-field"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Commits per Large Report"
                  value={planLimits.commitsPerLargeReport}
                  onChange={(e) => onLimitChange('commitsPerLargeReport', e.target.value)}
                  className="form-field"
                />

                <Button
                  variant="contained"
                  onClick={onLimitsUpdate}
                  disabled={loading}
                  className="action-button"
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Plan Limits'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* System Analytics */}
        {analytics && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                System Analytics
              </Typography>
            </Grid>

            {/* Key Metrics */}
            <Grid item xs={12} md={4}>
              <Paper className="stats-card">
                <Typography className="stats-card-title">
                  Total Users
                </Typography>
                <Typography className="stats-card-value">
                  {formatNumber(analytics.totalUsers)}
                </Typography>
                <Typography className="stats-card-description">
                  Active in the last 30 days: {formatNumber(analytics.activeUsers)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper className="stats-card">
                <Typography className="stats-card-title">
                  Total Reports
                </Typography>
                <Typography className="stats-card-value">
                  {formatNumber(analytics.totalReports)}
                </Typography>
                <Typography className="stats-card-description">
                  Generated in the last 30 days: {formatNumber(analytics.reportsLastMonth)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper className="stats-card">
                <Typography className="stats-card-title">
                  Total Commits Analyzed
                </Typography>
                <Typography className="stats-card-value">
                  {formatNumber(analytics.totalCommits)}
                </Typography>
                <Typography className="stats-card-description">
                  Analyzed in the last 30 days: {formatNumber(analytics.commitsLastMonth)}
                </Typography>
              </Paper>
            </Grid>

            {/* Monthly Stats */}
            <Grid item xs={12}>
              <Paper className="admin-section">
                <Typography variant="h6" className="admin-section-title">
                  Monthly Usage
                </Typography>

                <Grid container spacing={2}>
                  {analytics.monthlyUsage && analytics.monthlyUsage.map((month, index) => (
                    <Grid item xs={6} md={3} key={index}>
                      <Paper className="stats-card" sx={{ bgcolor: 'background.default' }}>
                        <Typography className="stats-card-title">
                          {month.month}
                        </Typography>
                        <Typography variant="body1">
                          Reports: {formatNumber(month.reports)}
                        </Typography>
                        <Typography variant="body1">
                          Commits: {formatNumber(month.commits)}
                        </Typography>
                        <Typography variant="body1">
                          Users: {formatNumber(month.users)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default AdminDashboardComponentTemplate;
