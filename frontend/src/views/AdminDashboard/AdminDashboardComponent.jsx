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
  Tab,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
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
  onUpdatePlan,
  onSetDefaultPlan
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ 
    name: '', 
    displayName: '', 
    description: '',
    limits: {
      reportsPerMonth: 100,
      commitsPerMonth: 1000,
      tokensPerMonth: 10000
    },
    isActive: true,
    isDefault: false
  });
  const [editingPlan, setEditingPlan] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenPlanDialog = () => {
    setPlanDialogOpen(true);
  };

  const handleClosePlanDialog = () => {
    setPlanDialogOpen(false);
    setNewPlan({ 
      name: '', 
      displayName: '', 
      description: '',
      limits: {
        reportsPerMonth: 100,
        commitsPerMonth: 1000,
        tokensPerMonth: 10000
      },
      isActive: true,
      isDefault: false
    });
    setEditingPlan(null);
  };

  const handleNewPlanChange = (field) => (event) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewPlan({ 
        ...newPlan, 
        [parent]: { 
          ...newPlan[parent], 
          [child]: event.target.type === 'number' ? parseInt(event.target.value) : event.target.value 
        } 
      });
    } else {
      setNewPlan({ 
        ...newPlan, 
        [field]: field === 'isActive' || field === 'isDefault' ? event.target.checked : event.target.value 
      });
    }
  };

  const handleAddPlan = async () => {
    const success = await onAddPlan(newPlan);
    if (success) {
      handleClosePlanDialog();
    }
  };

  const handleSetDefaultPlan = async (planId) => {
    await onSetDefaultPlan(planId);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setNewPlan({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      features: plan.features || '',
      limits: {
        reportsPerMonth: plan.limits?.reportsPerMonth || 100,
        commitsPerMonth: plan.limits?.commitsPerMonth || 1000,
        tokensPerMonth: plan.limits?.tokensPerMonth || 10000
      },
      isActive: plan.isActive ?? true,
      isDefault: plan.isDefault ?? false
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
                  <TableCell>Display Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reports/Month</TableCell>
                  <TableCell>Commits/Month</TableCell>
                  <TableCell>Tokens/Month</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availablePlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.displayName}</TableCell>
                    <TableCell>{plan.description}</TableCell>
                    <TableCell>{plan.limits?.reportsPerMonth || 100}</TableCell>
                    <TableCell>{plan.limits?.commitsPerMonth || 1000}</TableCell>
                    <TableCell>{plan.limits?.tokensPerMonth || 10000}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={plan.isActive ?? true} 
                        onChange={(e) => onUpdatePlan(plan._id, { ...plan, isActive: e.target.checked })}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={plan.isDefault ?? false} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSetDefaultPlan(plan._id);
                          }
                        }}
                        size="small"
                        disabled={plan.isDefault}
                      />
                    </TableCell>
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
      <Dialog open={planDialogOpen} onClose={handleClosePlanDialog} maxWidth="md" fullWidth>
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
            disabled={editingPlan !== null}
            helperText={editingPlan !== null ? "Plan name cannot be changed" : ""}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Display Name"
            fullWidth
            variant="standard"
            value={newPlan.displayName}
            onChange={handleNewPlanChange('displayName')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="standard"
            value={newPlan.description}
            onChange={handleNewPlanChange('description')}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Usage Limits
            <Tooltip title="Monthly usage limits for different features">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                label="Reports Per Month"
                type="number"
                fullWidth
                variant="outlined"
                value={newPlan.limits.reportsPerMonth}
                onChange={handleNewPlanChange('limits.reportsPerMonth')}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                label="Commits Per Month"
                type="number"
                fullWidth
                variant="outlined"
                value={newPlan.limits.commitsPerMonth}
                onChange={handleNewPlanChange('limits.commitsPerMonth')}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                margin="dense"
                label="Tokens Per Month"
                type="number"
                fullWidth
                variant="outlined"
                value={newPlan.limits.tokensPerMonth}
                onChange={handleNewPlanChange('limits.tokensPerMonth')}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <FormControlLabel 
              control={
                <Switch 
                  checked={newPlan.isActive} 
                  onChange={handleNewPlanChange('isActive')}
                />
              }
              label="Active"
            />
            
            <FormControlLabel 
              control={
                <Switch 
                  checked={newPlan.isDefault} 
                  onChange={handleNewPlanChange('isDefault')}
                />
              }
              label="Set as Default Plan"
              sx={{ ml: 2 }}
            />
          </Box>
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