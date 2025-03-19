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
  Tooltip
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

  return (
    <TableRow>
      <TableCell>{plan.name}</TableCell>
      <TableCell>{plan.displayName}</TableCell>
      <TableCell>
        {isEditing ? (
          <TextField
            type="number"
            value={editedPlan.limits.reportsPerMonth}
            onChange={handleChange('reportsPerMonth')}
            size="small"
            fullWidth
          />
        ) : (
          plan.limits.reportsPerMonth
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <TextField
            type="number"
            value={editedPlan.limits.commitsPerMonth}
            onChange={handleChange('commitsPerMonth')}
            size="small"
            fullWidth
          />
        ) : (
          plan.limits.commitsPerMonth
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
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
        ) : (
          <Tooltip title="Edit">
            <IconButton onClick={() => onUpdate(plan)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
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

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await api.getPlans();
        setPlans(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load plans. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.isAdmin) {
      fetchPlans();
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

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Admin Dashboard">
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
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

          <TableContainer component={Paper}>
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
        </Grid>
      </Grid>

      {/* New Plan Dialog */}
      <Dialog open={newPlanDialog} onClose={() => setNewPlanDialog(false)}>
        <DialogTitle>Create New Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Plan Name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Display Name"
              value={newPlan.displayName}
              onChange={(e) => setNewPlan({ ...newPlan, displayName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Reports per Month"
              type="number"
              value={newPlan.limits.reportsPerMonth}
              onChange={(e) => setNewPlan({
                ...newPlan,
                limits: { ...newPlan.limits, reportsPerMonth: parseInt(e.target.value) || 0 }
              })}
              fullWidth
            />
            <TextField
              label="Commits per Month"
              type="number"
              value={newPlan.limits.commitsPerMonth}
              onChange={(e) => setNewPlan({
                ...newPlan,
                limits: { ...newPlan.limits, commitsPerMonth: parseInt(e.target.value) || 0 }
              })}
              fullWidth
            />
          </Box>
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