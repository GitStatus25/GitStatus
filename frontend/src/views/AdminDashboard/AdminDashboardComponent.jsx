import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import './AdminDashboardComponent.css';

const AdminDashboardComponent = ({
  users,
  analytics,
  plans = [],
  loading,
  error,
  onUpdateUserRole,
  onUpdateUserPlan,
  onAddPlan,
  onUpdatePlan
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', rateLimit: '', price: '', features: '' });
  const [editingPlan, setEditingPlan] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenPlanDialog = () => {
    setPlanDialogOpen(true);
  };

  const handleClosePlanDialog = () => {
    setPlanDialogOpen(false);
    setNewPlan({ name: '', rateLimit: '', price: '', features: '' });
    setEditingPlan(null);
  };

  const handleNewPlanChange = (field) => (event) => {
    setNewPlan({ ...newPlan, [field]: event.target.value });
  };

  const handleAddPlan = async () => {
    const success = await onAddPlan(newPlan);
    if (success) {
      handleClosePlanDialog();
    }
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setNewPlan({
      name: plan.name,
      rateLimit: plan.rateLimit,
      price: plan.price,
      features: plan.features
    });
    setPlanDialogOpen(true);
  };

  const handleUpdatePlan = async () => {
    await onUpdatePlan(editingPlan, newPlan);
    handleClosePlanDialog();
  };

  if (loading) {
    return (
      <Container className="admin-dashboard-container">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="admin-dashboard-container">
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      </Container>
    );
  }

  // Use plans from props, fallback to empty array
  const availablePlans = plans.length > 0 ? plans : [
    { _id: 1, name: 'Free', rateLimit: '100 req/day', price: '$0', features: 'Basic access' }
  ];

  return (
    <Container className="admin-dashboard-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin dashboard tabs">
          <Tab label="Overview" />
          <Tab label="User Management" />
          <Tab label="Plan Management" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          {/* Enhanced Analytics Overview */}
          {analytics && (
            <>
              <Typography variant="h5" component="h2" gutterBottom>
                System Overview
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Users
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.numUniqueUsers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Standard Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.reportsStandard}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Large Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.reportsLarge}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.reportsStandard + analytics.allTimeStats.reportsLarge}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Commits
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.commitsTotal}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.monthlyStats.reportsStandard + analytics.monthlyStats.reportsLarge}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analytics.monthlyStats.reportsStandard} standard / {analytics.monthlyStats.reportsLarge} large
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Commits
                      </Typography>
                      <Typography variant="h4">
                        {analytics.monthlyStats.commitsTotal}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h5" component="h2" gutterBottom>
                Token Usage
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Input Tokens (All Time)
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.inputTokens?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {((analytics.allTimeStats.inputTokens / analytics.allTimeStats.totalTokens) * 100).toFixed(1)}% of total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Output Tokens (All Time)
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.outputTokens?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {((analytics.allTimeStats.outputTokens / analytics.allTimeStats.totalTokens) * 100).toFixed(1)}% of total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Tokens (All Time)
                      </Typography>
                      <Typography variant="h4">
                        {analytics.allTimeStats.totalTokens?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Input Tokens
                      </Typography>
                      <Typography variant="h4">
                        {analytics.monthlyStats.inputTokens?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {((analytics.monthlyStats.inputTokens / analytics.monthlyStats.totalTokens) * 100).toFixed(1)}% of monthly total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Output Tokens
                      </Typography>
                      <Typography variant="h4">
                        {analytics.monthlyStats.outputTokens?.toLocaleString() || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {((analytics.monthlyStats.outputTokens / analytics.monthlyStats.totalTokens) * 100).toFixed(1)}% of monthly total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h5" component="h2" gutterBottom>
                Cost Analysis
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Input Cost (All Time)
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.allTimeStats.inputCost?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ${(analytics.allTimeStats.inputTokens / 1000 * 0.01).toFixed(4)}/1K tokens
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Output Cost (All Time)
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.allTimeStats.outputCost?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ${(analytics.allTimeStats.outputTokens / 1000 * 0.03).toFixed(4)}/1K tokens
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Cost (All Time)
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.allTimeStats.totalCost?.toFixed(2) || '0.00'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Input Cost
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.monthlyStats.inputCost?.toFixed(2) || '0.00'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Output Cost
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.monthlyStats.outputCost?.toFixed(2) || '0.00'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monthly Total Cost
                      </Typography>
                      <Typography variant="h4">
                        ${analytics.monthlyStats.totalCost?.toFixed(2) || '0.00'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          {/* User Management */}
          <Typography variant="h5" component="h2" gutterBottom>
            User Management
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>GitHub Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Reports</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.githubUsername}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <FormControl variant="standard" size="small">
                        <Select
                          value={user.plan?._id || ''}
                          onChange={(e) => onUpdateUserPlan(user._id, e.target.value)}
                        >
                          {availablePlans.map(plan => (
                            <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>{user.reportCount || 0}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <FormControl variant="standard" size="small">
                        <Select
                          value={user.role}
                          onChange={(e) => onUpdateUserRole(user._id, e.target.value)}
                        >
                          <MenuItem value="user">User</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {activeTab === 2 && (
        <>
          {/* Plan Management */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Plan Management
            </Typography>
            <Button variant="contained" onClick={handleOpenPlanDialog}>
              Add New Plan
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan Name</TableCell>
                  <TableCell>Rate Limit</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Features</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availablePlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.rateLimit}</TableCell>
                    <TableCell>{plan.price}</TableCell>
                    <TableCell>{plan.features}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenEditPlan(plan)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialog for adding/editing a new plan */}
      <Dialog open={planDialogOpen} onClose={handleClosePlanDialog}>
        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Plan Name"
            fullWidth
            variant="standard"
            value={newPlan.name}
            onChange={handleNewPlanChange('name')}
          />
          <TextField
            margin="dense"
            label="Rate Limit"
            fullWidth
            variant="standard"
            value={newPlan.rateLimit}
            onChange={handleNewPlanChange('rateLimit')}
          />
          <TextField
            margin="dense"
            label="Price"
            fullWidth
            variant="standard"
            value={newPlan.price}
            onChange={handleNewPlanChange('price')}
          />
          <TextField
            margin="dense"
            label="Features"
            fullWidth
            variant="standard"
            value={newPlan.features}
            onChange={handleNewPlanChange('features')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlanDialog}>Cancel</Button>
          {editingPlan ? (
            <Button onClick={handleUpdatePlan}>Update</Button>
          ) : (
            <Button onClick={handleAddPlan}>Add</Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboardComponent; 