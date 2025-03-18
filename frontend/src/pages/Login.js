import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  useTheme,
  Fade,
  Paper
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Get the path to redirect to after login
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  // Get error message from URL if it exists
  const searchParams = new URLSearchParams(location.search);
  const error = searchParams.get('error');

  const handleGitHubLogin = () => {
    // Store the redirect path in sessionStorage to use after OAuth redirect
    sessionStorage.setItem('redirectPath', from);
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/github`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: theme.palette.background.gradient,
        py: 12,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '5%',
          left: '10%',
          width: '30%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(77, 171, 245, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          zIndex: 0,
          borderRadius: '50%',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '25%',
          height: '35%',
          background: 'radial-gradient(circle, rgba(179, 136, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          zIndex: 0,
          borderRadius: '50%',
        }
      }}
    >
      <Fade in={true} timeout={800}>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: 5,
              animation: 'slideUp 0.8s ease-out'
            }}
          >
            <Box 
              sx={{ 
                display: 'inline-block',
                borderRadius: '50%',
                p: 2,
                mb: 2,
                background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.5))',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'rotate(5deg) scale(1.05)',
                }
              }}
            >
              <GitHubIcon 
                sx={{ 
                  fontSize: 64, 
                  color: theme.palette.primary.main,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: theme.palette.primary.light
                  }
                }} 
              />
            </Box>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(90deg, #fff, #81d4fa)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}
            >
              GitStatus
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                opacity: 0.9,
                maxWidth: '80%',
                mx: 'auto',
                mb: 2
              }}
            >
              Analyze your GitHub commit history and generate concise reports
            </Typography>
          </Box>

          <Card 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundImage: theme.palette.background.cardGradient,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <CardContent sx={{ p: 5 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  lineHeight: 1.5
                }}
              >
                Connect your GitHub account to get started with GitStatus.
              </Typography>

              {error && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    border: '1px solid rgba(211, 47, 47, 0.3)'
                  }}
                >
                  <Typography color="error">
                    {error === 'auth_failed' 
                      ? 'Authentication failed. Please try again.' 
                      : 'An error occurred. Please try again.'}
                  </Typography>
                </Paper>
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleGitHubLogin}
                startIcon={
                  <GitHubIcon />
                }
                sx={{ 
                  py: 1.8,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(77, 171, 245, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 25px rgba(77, 171, 245, 0.6)',
                  }
                }}
              >
                Login with GitHub
              </Button>
            </CardContent>
          </Card>

          <Box sx={{ 
            textAlign: 'center',
            p: 3,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              GitStatus helps you track and report on your actual work by analyzing commit history
              and generating professional summaries using AI.
            </Typography>
          </Box>
        </Container>
      </Fade>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} GitStatus - GitHub Commit History Analyzer
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
