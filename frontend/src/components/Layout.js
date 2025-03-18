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
  // eslint-disable-next-line no-unused-vars
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import GitHubIcon from '@mui/icons-material/GitHub';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children, title }) => {
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
    }
  ];

  const drawer = (
    <Box 
      role="presentation" 
      onClick={toggleDrawer(false)} 
      onKeyDown={toggleDrawer(false)}
      sx={{ 
        width: 280,
        backgroundImage: theme.palette.background.gradient,
        height: '100%'
      }}
    >
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        mb: 2
      }}>
        <GitHubIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          GitStatus
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              sx={{
                borderRadius: 2,
                backgroundColor: activeLink === item.path ? 'rgba(77, 171, 245, 0.1)' : 'transparent',
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(77, 171, 245, 0.08)',
                },
                '&:before': activeLink === item.path ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  height: '60%',
                  width: 4,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '0 4px 4px 0'
                } : {}
              }}
            >
              <ListItemIcon sx={{ color: activeLink === item.path ? theme.palette.primary.main : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {activeLink === item.path && (
                <KeyboardArrowRightIcon fontSize="small" sx={{ opacity: 0.5 }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding sx={{ mt: 2 }}>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'error.light' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ 
                mr: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'rotate(180deg)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              '&:hover': {
                '& .logo-icon': {
                  transform: 'rotate(360deg)'
                }
              }
            }}
            component={RouterLink}
            to="/"
          >
            <GitHubIcon 
              className="logo-icon"
              sx={{ 
                mr: 1, 
                color: theme.palette.primary.main,
                transition: 'transform 0.5s ease-in-out',
              }} 
            />
            <Typography
              variant="h6"
              sx={{ 
                color: 'white', 
                textDecoration: 'none',
                fontWeight: 600,
                letterSpacing: '0.02em',
                background: 'linear-gradient(90deg, #fff, #81d4fa)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              GitStatus
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

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

export default Layout;
