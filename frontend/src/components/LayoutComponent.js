import React, { useContext, useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  useMediaQuery,
  useTheme,
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
import { AuthContext } from '../contexts/AuthContext';

/**
 * Main layout component that provides consistent structure across pages
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

  // Add Admin Dashboard if user is admin
  if (user?.role === 'admin') {
    menuItems.push({
      text: 'Admin Dashboard',
      icon: <AdminPanelSettingsIcon />,
      path: '/admin'
    });
  }

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 600
          }}
        >
          GitStatus
        </Typography>
      </Box>
      
      {user && (
        <>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {user.avatarUrl && (
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    mr: 2,
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                />
              )}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user.name || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email || user.login}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <List sx={{ mt: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={activeLink === item.path}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(77, 171, 245, 0.1)',
                      borderRight: '3px solid',
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(77, 171, 245, 0.2)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: activeLink === item.path ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontWeight: activeLink === item.path ? 600 : 400,
                    }}
                  />
                  {activeLink === item.path && (
                    <KeyboardArrowRightIcon fontSize="small" color="primary" />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
            <Divider sx={{ my: 1, mx: 2, opacity: 0.1 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  color: theme.palette.error.light,
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 1px 8px rgba(0,0,0,0.15)',
          backgroundImage: 'linear-gradient(90deg, #000000 0%, #1E293B 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Toolbar>
          {user && isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'white',
            }}
          >
            <GitHubIcon 
              sx={{ 
                mr: 1, 
                color: theme.palette.primary.main,
                filter: 'drop-shadow(0 0 5px rgba(77, 171, 245, 0.5))'
              }} 
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(90deg, #fff, #4dabf5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(77, 171, 245, 0.3)'
              }}
            >
              GitStatus
            </Typography>
          </Box>

          {user && !isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color={activeLink === item.path ? 'primary' : 'inherit'}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{ 
                    ml: 1,
                    position: 'relative',
                    '&:after': activeLink === item.path ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '15%',
                      width: '70%',
                      height: 2,
                      bgcolor: 'primary.main',
                      borderRadius: 4
                    } : {}
                  }}
                >
                  {item.text}
                </Button>
              ))}
              <Tooltip title="Logout">
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{ ml: 1 }}
                >
                  Logout
                </Button>
              </Tooltip>
              {user.avatarUrl && (
                <Tooltip title={user.name || 'User'}>
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    sx={{ 
                      ml: 2, 
                      width: 36, 
                      height: 36,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          px: { xs: 2, md: 3 },
          backgroundColor: theme.palette.background.default,
          backgroundImage: theme.palette.background.gradient,
        }}
      >
        <Fade in={animate} timeout={500}>
          <Container maxWidth="lg">
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
            {children}
          </Container>
        </Fade>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'linear-gradient(180deg, #1a1a1a 0%, #121212 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' GitStatus - GitHub Commit History Analyzer'}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LayoutComponent; 