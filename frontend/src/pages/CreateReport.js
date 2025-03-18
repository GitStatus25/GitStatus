import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useModal } from '../contexts/ModalContext';

// This page is now just a redirect to dashboard with modal opened
const CreateReport = () => {
  const navigate = useNavigate();
  const { openCreateReportModal } = useModal();

  useEffect(() => {
    openCreateReportModal();
    navigate('/dashboard');
  }, [navigate, openCreateReportModal]);

    return (
        <Box 
          sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
                  </Box>
  );
};

export default CreateReport;
