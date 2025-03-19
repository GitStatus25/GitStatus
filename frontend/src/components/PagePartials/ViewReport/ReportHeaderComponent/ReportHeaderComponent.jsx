import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import './ReportHeaderComponent.css';

const ReportHeaderComponentTemplate = ({ report }) => {
  const theme = useTheme();

  return (
    <Fade in={true} timeout={800}>
      <Box className="report-header">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/dashboard"
          className="back-button"
        >
          Back to Dashboard
        </Button>
        
        <Box className="action-buttons">
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              href={report?.downloadUrl}
              target="_blank"
              disabled={!report?.downloadUrl}
              className="download-button"
              sx={{
                boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
              }}
            >
              Download Report
            </Button>
          </Zoom>
        </Box>
      </Box>
    </Fade>
  );
};

export default ReportHeaderComponentTemplate; 