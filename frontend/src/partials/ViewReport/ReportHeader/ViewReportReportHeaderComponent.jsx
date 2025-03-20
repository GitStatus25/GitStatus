import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  useTheme,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import './ViewReportReportHeaderComponent.css';

/**
 * Template component for the report header
 */
const ViewReportReportHeaderComponentTemplate = ({ report }) => {
  const theme = useTheme();

  return (
    <Box className="report-header-container">
      <Box className="report-header-top">
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          className="back-button"
          variant="outlined"
          size="small"
        >
          Back to Dashboard
        </Button>
      </Box>

      <Box className="report-title-section">
        <DescriptionIcon className="report-icon" sx={{ color: theme.palette.primary.main }} />
        <Box>
          <Typography variant="h4" component="h1" className="report-title">
            {report.title || report.name || 'Untitled Report'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" className="report-subtitle">
            {report.description || 'No description provided'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ViewReportReportHeaderComponentTemplate; 