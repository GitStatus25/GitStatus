import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import PrivateRouteComponentTemplate from './PrivateRouteComponent.jsx';

/**
 * Private route component to protect authenticated routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 */
const PrivateRouteComponent = ({ children }) => {
  const { isAuthenticated, loading, checkAuth } = useContext(AuthContext);
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Recheck authentication when the component mounts or the route changes
  useEffect(() => {
    // Only check authentication once initially or if we explicitly need to recheck
    // (not on every route change)
    if (!loading && !checkingAuth && !hasCheckedAuth) {
      setCheckingAuth(true);
      checkAuth().finally(() => {
        setCheckingAuth(false);
        setHasCheckedAuth(true);
      });
    }
  }, [checkAuth, loading, checkingAuth, hasCheckedAuth]);

  // Determine if we're still loading
  const isLoading = loading || checkingAuth;

  // Log redirect for debugging purposes
  if (!isLoading && !isAuthenticated) {
    console.log("PrivateRoute: User not authenticated, redirecting to login");
  }

  return (
    <PrivateRouteComponentTemplate
      children={children}
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
      location={location}
    />
  );
};

export default PrivateRouteComponent;
