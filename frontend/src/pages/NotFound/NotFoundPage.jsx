import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import './NotFoundPage.css';

const NotFoundPageTemplate = () => {
  return (
    <Container maxWidth="sm">
      <Box className="not-found-container">
        <Typography variant="h1" component="h1" className="not-found-title">
          404
        </Typography>
        <Typography variant="h4" component="h2" className="not-found-subtitle">
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph className="not-found-message">
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          className="home-button"
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPageTemplate;
