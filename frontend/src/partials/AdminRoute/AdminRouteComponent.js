import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AdminRouteComponentTemplate from './AdminRouteComponent.jsx';

/**
 * AdminRoute component to protect admin-only routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when user is admin
 */
const AdminRouteComponent = ({ children }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // Check if user has admin role
  const isAdmin = user && user.role === 'admin';

  return (
    <AdminRouteComponentTemplate
      children={children}
      isLoading={loading}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      location={location}
    />
  );
};

export default AdminRouteComponent;
