import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Fade,
  Paper
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import './LoginPage.css';

const LoginPageTemplate = ({ 
  error, 
  handleGitHubLogin, 
  theme 
}) => {
  return (
    <Box
      className="login-container"
      sx={{
        bgcolor: 'background.default',
        backgroundImage: theme?.palette?.background?.gradient
      }}
    >
      <Fade in={true} timeout={800}>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Box className="login-header">
            <Box className="login-icon-container">
              <GitHubIcon 
                className="login-icon"
                sx={{ color: theme?.palette?.primary?.main }}
              />
            </Box>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              className="login-title"
            >
              GitStatus
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              className="login-subtitle"
            >
              Analyze your GitHub commit history and generate concise reports
            </Typography>
          </Box>

          <Card className="login-card" sx={{ backgroundImage: theme?.palette?.background?.cardGradient }}>
            <CardContent className="login-card-content">
              <Typography 
                variant="body1" 
                className="login-instructions"
              >
                Connect your GitHub account to get started with GitStatus.
              </Typography>

              {error && (
                <Paper
                  elevation={0}
                  className="login-error"
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
                startIcon={<GitHubIcon />}
                className="login-button"
              >
                Login with GitHub
              </Button>
            </CardContent>
          </Card>

          <Box className="description-box">
            <Typography variant="body2" color="text.secondary" className="description-text">
              GitStatus helps you track and report on your actual work by analyzing commit history
              and generating professional summaries using AI.
            </Typography>
          </Box>
        </Container>
      </Fade>

      <Box
        component="footer"
        className="login-footer"
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} GitStatus - GitHub Commit History Analyzer
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPageTemplate;
