import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.getAdminAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch analytics' });
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await api.updateUserRole(selectedUser.id, newRole);
      setMessage({ type: 'success', text: 'User role updated successfully' });
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user role' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
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
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            
            <Autocomplete
              options={users}
              getOptionLabel={(option) => `${option.username} (${option.role})`}
              value={selectedUser}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
                if (newValue) {
                  setNewRole(newValue.role);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  variant="outlined"
                />
              )}
              sx={{ mb: 2 }}
            />

            <TextField
              select
              fullWidth
              label="New Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              SelectProps={{
                native: true,
              }}
              sx={{ mb: 2 }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </TextField>

            <Button
              variant="contained"
              onClick={handleRoleChange}
              disabled={!selectedUser || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Role'}
            </Button>
          </Paper>
        </Grid>

        {/* Analytics Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Analytics
            </Typography>

            {analytics ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Current Month Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Total Reports</Typography>
                    <Typography variant="h6">{analytics?.summary?.totalReports || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Total Commits</Typography>
                    <Typography variant="h6">{analytics?.summary?.totalCommits || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>Token Usage</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Input: {analytics?.summary?.inputTokens?.toLocaleString() || 0} tokens
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Output: {analytics?.summary?.outputTokens?.toLocaleString() || 0} tokens
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total: {analytics?.summary?.totalTokens?.toLocaleString() || 0} tokens
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>Cost Breakdown</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Input: ${(analytics?.summary?.inputCost || 0).toFixed(4)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Output: ${(analytics?.summary?.outputCost || 0).toFixed(4)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total: ${(analytics?.summary?.totalCost || 0).toFixed(4)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">Active Users</Typography>
                    <Typography variant="h6">{analytics?.summary?.uniqueUsers?.length || 0}</Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <CircularProgress />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;