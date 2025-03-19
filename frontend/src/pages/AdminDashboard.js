import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Autocomplete,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const PlanRow = ({ plan, onUpdate, onSave, onCancel, isEditing }) => {
  const [editedPlan, setEditedPlan] = useState(plan);

  const handleChange = (field) => (event) => {
    setEditedPlan({
      ...editedPlan,
      limits: {
        ...editedPlan.limits,
        [field]: parseInt(event.target.value) || 0
      }
    });
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <TextField
            fullWidth
            value={editedPlan.name}
            onChange={(e) => setEditedPlan({ ...editedPlan, name: e.target.value })}
            size="small"
          />
        </TableCell>
        <TableCell>
          <TextField
            fullWidth
            value={editedPlan.displayName}
            onChange={(e) => setEditedPlan({ ...editedPlan, displayName: e.target.value })}
            size="small"
          />
        </TableCell>
        <TableCell>
          <TextField
            fullWidth
            type="number"
            value={editedPlan.limits.reportsPerMonth}
            onChange={handleChange('reportsPerMonth')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <TextField
            fullWidth
            type="number"
            value={editedPlan.limits.commitsPerMonth}
            onChange={handleChange('commitsPerMonth')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Save">
              <IconButton onClick={() => onSave(editedPlan)} color="primary">
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton onClick={onCancel} color="error">
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{plan.name}</TableCell>
      <TableCell>{plan.displayName}</TableCell>
      <TableCell>{plan.limits.reportsPerMonth}</TableCell>
      <TableCell>{plan.limits.commitsPerMonth}</TableCell>
      <TableCell>
        <Tooltip title="Edit">
          <IconButton onClick={() => onUpdate(plan)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

const AdminDashboard = () => {
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlanDialog, setNewPlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    displayName: '',
    limits: {
      reportsPerMonth: 50,
      commitsPerMonth: 500
    }
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [analytics, setAnalytics] = useState(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansResponse, usersResponse, analyticsResponse] = await Promise.all([
          api.getPlans(),
          api.getUsers(),
          api.getAdminAnalytics()
        ]);
        setPlans(plansResponse.data);
        setUsers(usersResponse.users);
        setAnalytics(analyticsResponse.analytics);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const handleUpdatePlan = async (updatedPlan) => {
    try {
      await api.updatePlan(updatedPlan._id, updatedPlan);
      setPlans(plans.map(plan => 
        plan._id === updatedPlan._id ? updatedPlan : plan
      ));
      setEditingPlan(null);
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Failed to update plan. Please try again.');
    }
  };

  const handleCreatePlan = async () => {
    try {
      const response = await api.createPlan(newPlan);
      setPlans([...plans, response.data]);
      setNewPlanDialog(false);
      setNewPlan({
        name: '',
        displayName: '',
        limits: {
          reportsPerMonth: 50,
          commitsPerMonth: 500
        }
      });
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Failed to create plan. Please try again.');
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      await api.updateUserRole(selectedUser.id, newRole);
      setMessage({ type: 'success', text: 'User role updated successfully' });
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user role' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
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
              Analytics Overview
            </Typography>
            {analytics && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Users
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalUsers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalReports}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Commits
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalCommits}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Users
                      </Typography>
                      <Typography variant="h4">
                        {analytics.activeUsers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Plan Management Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Plan Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewPlanDialog(true)}
              >
                Create New Plan
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Plan Name</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Reports/Month</TableCell>
                    <TableCell>Commits/Month</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map(plan => (
                    <PlanRow
                      key={plan._id}
                      plan={plan}
                      isEditing={editingPlan?._id === plan._id}
                      onUpdate={setEditingPlan}
                      onSave={handleUpdatePlan}
                      onCancel={() => setEditingPlan(null)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* New Plan Dialog */}
      <Dialog open={newPlanDialog} onClose={() => setNewPlanDialog(false)}>
        <DialogTitle>Create New Plan</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Plan Name"
            fullWidth
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Display Name"
            fullWidth
            value={newPlan.displayName}
            onChange={(e) => setNewPlan({ ...newPlan, displayName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Reports per Month"
            type="number"
            fullWidth
            value={newPlan.limits.reportsPerMonth}
            onChange={(e) => setNewPlan({
              ...newPlan,
              limits: { ...newPlan.limits, reportsPerMonth: parseInt(e.target.value) || 0 }
            })}
          />
          <TextField
            margin="dense"
            label="Commits per Month"
            type="number"
            fullWidth
            value={newPlan.limits.commitsPerMonth}
            onChange={(e) => setNewPlan({
              ...newPlan,
              limits: { ...newPlan.limits, commitsPerMonth: parseInt(e.target.value) || 0 }
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPlanDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePlan} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard; 