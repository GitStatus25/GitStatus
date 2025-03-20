import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminDashboardTemplate from './AdminDashboardComponent.jsx';

const AdminDashboardComponent = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch users and analytics data in parallel
        const [usersResponse, analyticsResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/analytics')
        ]);
        
        setUsers(usersResponse.data);
        setAnalytics(analyticsResponse.data);
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
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      
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

  return (
    <AdminDashboardTemplate
      users={users}
      analytics={analytics}
      loading={loading}
      error={error}
      onUpdateUserRole={handleUpdateUserRole}
    />
  );
};

export default AdminDashboardComponent; 