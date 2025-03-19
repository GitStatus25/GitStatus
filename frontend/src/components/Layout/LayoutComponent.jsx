import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Tooltip,
  Fade,
  Badge,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import GitHubIcon from '@mui/icons-material/GitHub';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import './LayoutComponent.css';

const LayoutComponentTemplate = ({
  children,
  title,
  user,
  handleLogout,
  isMobile,
  drawerOpen,
  toggleDrawer,
  activeLink,
  animate,
  theme
}) => {
  // Define menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      text: 'Create Report',
      icon: <NoteAddIcon />,
      path: '/create-report'
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics'
    }
  ];

  // Drawer content component
  const drawer = (
    <Box
      className="drawer-container"
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider'
      }}
    >
      <Box className="drawer-header">
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          GitStatus
        </Typography>
      </Box>
      <Divider />
      <List className="drawer-list">
        {user?.role === 'admin' && (
          <ListItem disablePadding className="menu-item">
            <ListItemButton 
              component={RouterLink} 
              to="/admin"
              className={`menu-button-item ${activeLink === '/admin' ? 'menu-button-active' : ''}`}
              sx={{
                '&:before': activeLink === '/admin' ? {
                  backgroundColor: theme.palette.primary.main
                } : {}
              }}
            >
              <ListItemIcon sx={{ color: activeLink === '/admin' ? theme.palette.primary.main : 'inherit' }}>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Admin Panel" />
              {activeLink === '/admin' && (
                <KeyboardArrowRightIcon fontSize="small" className="active-link-indicator" />
              )}
            </ListItemButton>
          </ListItem>
        )}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding className="menu-item">
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              className={`menu-button-item ${activeLink === item.path ? 'menu-button-active' : ''}`}
              sx={{
                '&:before': activeLink === item.path ? {
                  backgroundColor: theme.palette.primary.main
                } : {}
              }}
            >
              <ListItemIcon sx={{ color: activeLink === item.path ? theme.palette.primary.main : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {activeLink === item.path && (
                <KeyboardArrowRightIcon fontSize="small" className="active-link-indicator" />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            className="logout-button"
          >
            <ListItemIcon>
              <LogoutIcon className="logout-icon" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box className="layout-container">
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              className="menu-button"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            className="logo-container"
            component={RouterLink}
            to="/"
          >
            <GitHubIcon 
              className="logo-icon"
              sx={{ color: theme.palette.primary.main }} 
            />
            <Typography
              variant="h6"
              className="app-title"
            >
              GitStatus
            </Typography>
          </Box>
          
          <Box className="title-container">
            <Fade in={animate} timeout={500}>
              <Typography variant="h6" className="page-title">
                {title}
              </Typography>
            </Fade>
          </Box>
          
          {user && (
            <Box className="user-section">
              <Tooltip title={`Logged in as ${user.name || user.username || 'User'}`}>
                <Avatar
                  className="user-avatar"
                  alt={user.name || user.username}
                  src={user.avatar}
                  sx={{ 
                    bgcolor: theme.palette.primary.main
                  }}
                >
                  {!user.avatar && (user.name?.[0] || user.username?.[0] || 'U')}
                </Avatar>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Drawer for mobile */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
        >
          {drawer}
        </Drawer>
      )}
      
      {/* Desktop layout with persistent drawer */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {!isMobile && (
          <Box sx={{ width: 250, flexShrink: 0 }}>
            {drawer}
          </Box>
        )}
        
        <Box component="main" className="main-content">
          <Container>
            {children}
          </Container>
        </Box>
      </Box>
      
      <Box component="footer" className="footer">
        <Typography className="footer-text">
          © {new Date().getFullYear()} GitStatus - Analyze your GitHub commit history
        </Typography>
      </Box>
    </Box>
  );
};

export default LayoutComponentTemplate;
