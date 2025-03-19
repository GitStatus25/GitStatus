import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
  useTheme
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import './PDFPreviewComponent.css';

const PDFPreviewComponentTemplate = ({ 
  report, 
  pdfStatus = 'loading', 
  pdfProgress = 0,
  pdfPreviewFailed,
  iframeRef,
  handleIframeLoad,
  handleIframeError
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card 
      className="pdf-preview-card"
      sx={{
        backgroundImage: theme.palette.background.cardGradient,
      }}
    >
      <CardContent className="card-content">
        <Box className="card-header">
          <DescriptionIcon className="header-icon" sx={{ color: theme.palette.primary.main }} />
          <Typography 
            variant="h5" 
            component="h2" 
            className="header-title"
            sx={{ 
              background: 'linear-gradient(90deg, #fff, #81d4fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Report Preview
          </Typography>
        </Box>
        
        <Divider className="divider" />

        <Box className="pdf-container">
          {pdfStatus === 'pending' || pdfStatus === 'waiting' || pdfStatus === 'active' ? (
            <Box className="pdf-loading-container">
              <CircularProgress 
                variant={pdfProgress > 0 ? "determinate" : "indeterminate"} 
                value={pdfProgress}
                size={60}
                thickness={4}
                className="pdf-loading-spinner"
              />
              <Typography variant="h6" gutterBottom>
                Generating PDF Report
              </Typography>
              <Typography variant="body2" color="text.secondary" className="pdf-status-message">
                {pdfStatus === 'active' 
                  ? `Processing... (${pdfProgress}% complete)`
                  : "Your report is being generated. This may take a moment..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="pdf-status-info">
                You can check back later or wait on this page. The report will automatically update when ready.
              </Typography>
            </Box>
          ) : pdfStatus === 'failed' ? (
            <Box className="pdf-error-container">
              <Typography variant="h6" gutterBottom color="error">
                PDF Generation Failed
              </Typography>
              <Typography variant="body2" color="text.secondary" className="pdf-error-message">
                There was a problem generating your PDF. Please try again or contact support if the issue persists.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                className="dashboard-button"
              >
                Back to Dashboard
              </Button>
            </Box>
          ) : report?.downloadUrl && !pdfPreviewFailed ? (
            <iframe
              ref={iframeRef}
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(report.downloadUrl)}&embedded=true`}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Report Document Viewer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="pdf-iframe"
            />
          ) : (
            <Box className="pdf-fallback-container">
              <Typography variant="h6" gutterBottom>
                PDF Preview not available
              </Typography>
              <Typography variant="body2" color="text.secondary" className="pdf-fallback-message">
                {report?.downloadUrl ? 
                  "Your browser doesn't support the embedded PDF viewer or the document couldn't be loaded. Please use the button below to download and view the report." :
                  "The PDF download is not available yet. Please check back later."}
              </Typography>
              {report?.downloadUrl && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  href={report.downloadUrl}
                  target="_blank"
                  className="download-button"
                >
                  Download Report
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PDFPreviewComponentTemplate; 