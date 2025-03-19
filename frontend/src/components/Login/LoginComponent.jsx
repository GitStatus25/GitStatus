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
      <Container maxWidth="sm">
        <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>
          <Grid item xs={12}>
            <Paper className="login-paper" elevation={3}>
              <Box className="login-box">
                <Typography variant="h4" component="h1" className="login-title">
                  Welcome to GitStatus
                </Typography>
                
                <Typography variant="body1" className="login-subtitle">
                  Generate professional reports from your git commits
                </Typography>
                
                {error && (
                  <Alert severity="error" className="login-error">
                    {error === 'access_denied' 
                      ? 'GitHub access was denied. Please try again.' 
                      : 'An error occurred during login. Please try again.'}
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  className="github-button"
                  startIcon={<GitHubIcon />}
                  onClick={handleGitHubLogin}
                  sx={{
                    bgcolor: '#24292e',
                    '&:hover': {
                      bgcolor: '#1b1f23'
                    }
                  }}
                >
                  Login with GitHub
                </Button>
                
                <Box className="login-features">
                  <Typography variant="subtitle1" className="features-title">
                    GitStatus helps you:
                  </Typography>
                  <ul className="features-list">
                    <li>Generate professional summaries of your work</li>
                    <li>Track your development progress over time</li>
                    <li>Export polished PDF reports for clients or managers</li>
                    <li>Analyze commit patterns to improve productivity</li>
                  </ul>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginComponentTemplate;
