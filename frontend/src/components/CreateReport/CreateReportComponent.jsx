import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import './CreateReportComponent.css';

const CreateReportComponentTemplate = () => {
  return (
    <Box className="loading-container">
      <CircularProgress />
    </Box>
  );
};

export default CreateReportComponentTemplate;
