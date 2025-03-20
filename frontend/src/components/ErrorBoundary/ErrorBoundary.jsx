import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Button, Typography } from '@mui/material';
import './ErrorBoundary.css';

/**
 * ErrorBoundary template component - displays fallback UI for errors
 */
const ErrorBoundaryTemplate = ({
  errorMessage,
  errorDetails,
  showDetails,
  resetable,
  resetButtonText,
  onReset
}) => {
  return (
    <Box 
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
      className="error-boundary-container"
    >
      <Alert 
        severity="error" 
        variant="filled"
        sx={{ width: '100%', mb: 2 }}
      >
        {errorMessage || 'Something went wrong'}
      </Alert>
      
      {showDetails && errorDetails && (
        <Typography variant="body2" color="text.secondary">
          {errorDetails}
        </Typography>
      )}
      
      {!showDetails && (
        <Typography variant="body2" color="text.secondary">
          The application encountered an error and cannot continue.
        </Typography>
      )}
      
      {resetable && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onReset}
          className="error-reset-button"
        >
          {resetButtonText}
        </Button>
      )}
    </Box>
  );
};

ErrorBoundaryTemplate.propTypes = {
  errorMessage: PropTypes.string,
  errorDetails: PropTypes.string,
  showDetails: PropTypes.bool,
  resetable: PropTypes.bool,
  resetButtonText: PropTypes.string,
  onReset: PropTypes.func
};

ErrorBoundaryTemplate.defaultProps = {
  errorMessage: 'An error occurred while loading this component',
  showDetails: false,
  resetable: true,
  resetButtonText: 'Try Again'
};

export default ErrorBoundaryTemplate; 