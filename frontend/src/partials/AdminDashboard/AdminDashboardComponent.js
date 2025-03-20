import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js';
import api from '../../services/api.js';
import AdminDashboardComponentTemplate from './AdminDashboardComponent.jsx';

/**
 * AdminDashboard component - Admin control panel for user and plan management
 */
const AdminDashboardComponent = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planLimits, setPlanLimits] = useState({
    reportsPerMonth: 0,
    commitsPerStandardReport: 0,
    commitsPerLargeReport: 0
  });

  // Fetch data when component mounts
  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
    fetchPlans();
  }, []);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await api.getAdminAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch analytics' });
    }
  };

  // Fetch plans
  const fetchPlans = async () => {
    try {
      const response = await api.getPlans();
      setPlans(response.plans);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch plans' });
    }
  };

  // Handle user selection
  const handleUserSelect = (event, newValue) => {
    setSelectedUser(newValue);
    if (newValue) {
      setNewRole(newValue.role);
    }
  };

  // Handle role change
  const handleRoleChange = (event) => {
    setNewRole(event.target.value);
  };

  // Handle role update
  const handleRoleUpdate = async () => {
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

  // Handle plan selection
  const handlePlanSelect = (event, newValue) => {
    setSelectedPlan(newValue);
    if (newValue) {
      setPlanLimits(newValue.limits);
    }
  };

  // Handle limit change
  const handleLimitChange = (field, value) => {
    setPlanLimits(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  // Handle limits update
  const handleLimitsUpdate = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      await api.updatePlanLimits(selectedPlan._id, planLimits);
      setMessage({ type: 'success', text: 'Plan limits updated successfully' });
      fetchPlans();
      setSelectedPlan(null);
      setPlanLimits({
        reportsPerMonth: 0,
        commitsPerStandardReport: 0,
        commitsPerLargeReport: 0
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update plan limits' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDashboardComponentTemplate
      user={user}
      users={users}
      selectedUser={selectedUser}
      newRole={newRole}
      message={message}
      loading={loading}
      analytics={analytics}
      plans={plans}
      selectedPlan={selectedPlan}
      planLimits={planLimits}
      onUserSelect={handleUserSelect}
      onRoleChange={handleRoleChange}
      onRoleUpdate={handleRoleUpdate}
      onPlanSelect={handlePlanSelect}
      onLimitChange={handleLimitChange}
      onLimitsUpdate={handleLimitsUpdate}
    />
  );
};

export default AdminDashboardComponent;
