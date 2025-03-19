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

/**
 * Header component for the ViewReport page with navigation and actions
 */
const ReportHeaderComponent = ({ report }) => {
  const theme = useTheme();

  return (
    <Fade in={true} timeout={800}>
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          pb: 3
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/dashboard"
          sx={{ 
            borderRadius: 2,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateX(-5px)'
            }
          }}
        >
          Back to Dashboard
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              href={report?.downloadUrl}
              target="_blank"
              disabled={!report?.downloadUrl}
              sx={{
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(77, 171, 245, 0.4)',
                }
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

export default ReportHeaderComponent; 