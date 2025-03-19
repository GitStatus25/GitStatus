import React, { useEffect, useRef, useState } from 'react';
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

/**
 * Component for previewing PDFs with various states (loading, failed, preview)
 */
const PDFPreviewComponent = ({ 
  report, 
  pdfStatus = 'loading', 
  pdfProgress = 0 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);

  useEffect(() => {
    // Check if PDF preview is available after component mounts
    const checkPdfPreview = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          // If the iframe is empty or throws an error, show fallback
          setTimeout(() => {
            try {
              // Check if iframe content is accessible
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              // If empty or has an error message
              if (!iframeDoc || iframeDoc.body.innerHTML === '' || 
                  iframeDoc.body.innerHTML.includes('error')) {
                setPdfPreviewFailed(true);
              }
            } catch (err) {
              // Cross-origin errors will be caught here
              setPdfPreviewFailed(true);
            }
          }, 3000); // Give it 3 seconds to load
        }
      } catch (e) {
        setPdfPreviewFailed(true);
      }
    };

    if (report?.downloadUrl && pdfStatus !== 'pending' && pdfStatus !== 'failed') {
      checkPdfPreview();
    }
  }, [report, pdfStatus]);

  return (
    <Card 
      elevation={2}
      sx={{
        border: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundImage: theme.palette.background.cardGradient,
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #fff, #81d4fa)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              m: 0 
            }}
          >
            Report Preview
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        <Box 
          sx={{ 
            width: '100%',
            height: '600px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {pdfStatus === 'pending' || pdfStatus === 'waiting' || pdfStatus === 'active' ? (
            <Box 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(18, 24, 36, 0.9)',
                p: 3,
                textAlign: 'center'
              }}
            >
              <CircularProgress 
                variant={pdfProgress > 0 ? "determinate" : "indeterminate"} 
                value={pdfProgress}
                size={60}
                thickness={4}
                sx={{ mb: 3 }}
              />
              <Typography variant="h6" gutterBottom>
                Generating PDF Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxWidth: 500 }}>
                {pdfStatus === 'active' 
                  ? `Processing... (${pdfProgress}% complete)`
                  : "Your report is being generated. This may take a moment..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                You can check back later or wait on this page. The report will automatically update when ready.
              </Typography>
            </Box>
          ) : pdfStatus === 'failed' ? (
            <Box 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(18, 24, 36, 0.9)',
                p: 3,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom color="error">
                PDF Generation Failed
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                There was a problem generating your PDF. Please try again or contact support if the issue persists.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
                }}
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
              onLoad={(e) => {
                try {
                  const iframe = e.target;
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (!iframeDoc || iframeDoc.body.innerHTML === '') {
                    setPdfPreviewFailed(true);
                  }
                } catch (err) {
                  setPdfPreviewFailed(true);
                }
              }}
              onError={() => setPdfPreviewFailed(true)}
            />
          ) : (
            <Box 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(18, 24, 36, 0.9)',
                p: 3,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom>
                PDF Preview not available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
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
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PDFPreviewComponent; 