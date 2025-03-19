import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import './NotFoundComponent.css';

const NotFoundComponentTemplate = () => {
  return (
    <Box className="not-found-container">
      <Typography variant="h1" className="not-found-title">
        404
      </Typography>
      <Typography variant="h4" className="not-found-subtitle">
        Page Not Found
      </Typography>
      <Typography variant="body1" className="not-found-message">
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button
        component={RouterLink}
        to="/dashboard"
        variant="contained"
        color="primary"
        className="not-found-button"
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default NotFoundComponentTemplate;
