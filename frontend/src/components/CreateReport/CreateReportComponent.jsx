import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import './CreateReportPage.css';

const CreateReportPageTemplate = () => {
  return (
    <Box className="loading-container">
      <CircularProgress />
    </Box>
  );
};

export default CreateReportPageTemplate;
