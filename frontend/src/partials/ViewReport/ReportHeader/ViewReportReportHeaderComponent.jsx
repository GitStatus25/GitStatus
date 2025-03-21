import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  useTheme,
  Typography,
  Divider
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
    <Paper 
      elevation={0}
      className="report-header-container"
      sx={{ 
        mb: 4,
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}22, ${theme.palette.primary.main}11)`,
        borderRadius: '12px',
        borderLeft: `4px solid ${theme.palette.primary.main}`,
      }}
    >
      <Box className="report-title-section" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DescriptionIcon 
          className="report-icon" 
          sx={{ 
            color: theme.palette.primary.main,
            fontSize: '2.5rem',
            mr: 2
          }} 
        />
        <Typography 
          variant="h4" 
          component="h1" 
          className="report-title"
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          {report.title || report.name || 'Untitled Report'}
        </Typography>
      </Box>
      
      {report.description && (
        <Box mt={2} textAlign="center">
          <Divider sx={{ my: 2, opacity: 0.1 }} />
          <Typography variant="body1" color="text.secondary" fontStyle="italic">
            {report.description}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ViewReportReportHeaderComponentTemplate; 