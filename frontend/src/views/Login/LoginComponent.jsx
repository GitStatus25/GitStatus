import React from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  Alert
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import './LoginComponent.css';

const LoginComponentTemplate = ({ handleGitHubLogin, theme, error }) => {
  return (
    <Box className="login-container">
      <Container maxWidth="md">
        <Box className="login-header">
          <Typography variant="h3" component="h1" className="login-title">
            Welcome to GitStatus
          </Typography>
          
          <Typography variant="h6" className="login-subtitle">
            Generate professional reports from your git commits
          </Typography>
        </Box>
        
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper className="login-card" elevation={3}>
              <Box className="login-card-content">
                {error && (
                  <Alert severity="error" className="login-error">
                    {error === 'access_denied' 
                      ? 'GitHub access was denied. Please try again.' 
                      : 'An error occurred during login. Please try again.'}
                  </Alert>
                )}
                
                <Typography variant="body1" className="login-instructions" sx={{ marginBottom: '24px' }}>
                  Sign in with your GitHub account to get started
                </Typography>
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  className="login-button"
                  startIcon={<GitHubIcon />}
                  onClick={handleGitHubLogin}
                  sx={{
                    bgcolor: '#2da44e',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: '#2c974b',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                    },
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  Login with GitHub
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box className="description-box">
              <Typography variant="h6" gutterBottom>
                GitStatus helps you:
              </Typography>
              <Box component="ul" sx={{ textAlign: 'left' }}>
                <Typography component="li" className="description-text">
                  Generate professional summaries of your work
                </Typography>
                <Typography component="li" className="description-text">
                  Track your development progress over time
                </Typography>
                <Typography component="li" className="description-text">
                  Export polished PDF reports for clients or managers
                </Typography>
                <Typography component="li" className="description-text">
                  Analyze commit patterns to improve productivity
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box className="login-footer">
          <Typography variant="body2" color="textSecondary">
            &copy; {new Date().getFullYear()} GitStatus - Your development activity, beautifully presented
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginComponentTemplate;
