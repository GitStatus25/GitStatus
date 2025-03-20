import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import './AuthCallbackComponent.css';

const AuthCallbackComponentTemplate = ({ error }) => {
  return (
    <Box
      className="auth-callback-container"
      sx={{
        bgcolor: 'background.default',
      }}
    >
      {error && (
        <Alert severity="error" className="auth-callback-error">
          {error}
        </Alert>
      )}
      
      <CircularProgress 
        size={60} 
        thickness={4} 
        className="auth-callback-spinner"
      />
      <Typography 
        variant="h6" 
        className="auth-callback-text"
      >
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthCallbackComponentTemplate;
