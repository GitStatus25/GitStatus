import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import { AuthContext } from '../../../contexts/AuthContext.js';
import LayoutComponentTemplate from './LayoutComponent.jsx';

/**
 * Layout component - Contains the main application layout with navigation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render inside the layout
 * @param {string} props.title - Page title to display in the header
 */
const LayoutComponent = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Set the active link based on current path
    const path = location.pathname;
    setActiveLink(path);
    
    // Trigger animation whenever location changes
    setAnimate(true);
  }, [location]);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <LayoutComponentTemplate
      children={children}
      title={title}
      user={user}
      handleLogout={handleLogout}
      isMobile={isMobile}
      drawerOpen={drawerOpen}
      toggleDrawer={toggleDrawer}
      activeLink={activeLink}
      animate={animate}
      theme={theme}
    />
  );
};

export default LayoutComponent;
