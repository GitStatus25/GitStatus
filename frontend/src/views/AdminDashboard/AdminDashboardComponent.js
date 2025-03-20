import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminDashboardTemplate from './AdminDashboardComponent.jsx';

const AdminDashboardComponent = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch users, analytics, and plans data in parallel
        const [usersResponse, analyticsResponse, plansResponse] = await Promise.all([
          api.getUsers(),
          api.getAdminAnalytics(),
          api.getPlans()
        ]);
        setUsers(usersResponse.users);
        setAnalytics(analyticsResponse.data);
        setPlans(plansResponse.plans || []);
        setError(null);
      } catch (err) {
        setError('Failed to load admin data. Please try again.');
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      
      // Update local state to reflect the change
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      setError('Failed to update user role. Please try again.');
      console.error('Update user role error:', err);
    }
  };

  const handleUpdateUserPlan = async (userId, planId) => {
    try {
      await api.updateUserPlan(userId, planId);
      
      // Update local state to reflect the change
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, plan: plans.find(p => p._id === planId) } : user
        )
      );
    } catch (err) {
      setError('Failed to update user plan. Please try again.');
      console.error('Update user plan error:', err);
    }
  };

  const handleAddPlan = async (planData) => {
    try {
      const response = await api.createPlan(planData);
      setPlans(prevPlans => [...prevPlans, response.plan]);
      return true;
    } catch (err) {
      setError('Failed to create new plan. Please try again.');
      console.error('Create plan error:', err);
      return false;
    }
  };

  const handleUpdatePlan = async (planId, planData) => {
    try {
      await api.updatePlan(planId, planData);
      
      // Update local state to reflect the change
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan._id === planId ? { ...plan, ...planData } : plan
        )
      );
    } catch (err) {
      setError('Failed to update plan. Please try again.');
      console.error('Update plan error:', err);
    }
  };

  return (
    <AdminDashboardTemplate
      users={users}
      analytics={analytics}
      plans={plans}
      loading={loading}
      error={error}
      onUpdateUserRole={handleUpdateUserRole}
      onUpdateUserPlan={handleUpdateUserPlan}
      onAddPlan={handleAddPlan}
      onUpdatePlan={handleUpdatePlan}
    />
  );
};

export default AdminDashboardComponent; 