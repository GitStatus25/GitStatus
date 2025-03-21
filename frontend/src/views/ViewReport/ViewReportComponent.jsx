import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  ViewReportReportHeaderComponent,
  ViewReportReportMetadataComponent,
  ViewReportCommitListComponent,
  ViewReportPDFPreviewComponent
} from '../../partials/ViewReport';
import './ViewReportComponent.css';

const ViewReportComponentTemplate = ({
  loading,
  error,
  report,
  onBack,
  summaryStatus = 'pending',
  summaryProgress = 0,
  reportStatus = 'pending',
  reportProgress = 0,
  pdfStatus = 'pending',
  pdfProgress = 0,
  pdfPreviewFailed,
  iframeRef,
  handleIframeLoad,
  handleIframeError,
  formatDate,
}) => {
  // Define the steps for the stepper
  const steps = [
    { label: 'Summarizing Commits', status: summaryStatus, progress: summaryProgress },
    { label: 'Generating Report', status: reportStatus, progress: reportProgress },
    { label: 'Creating PDF', status: pdfStatus, progress: pdfProgress }
  ];

  // Determine the active step based on status
  const getActiveStep = () => {
    if (summaryStatus !== 'completed') return 0;
    if (reportStatus !== 'completed') return 1;
    if (pdfStatus !== 'completed') return 2;
    return 3; // All completed
  };

  // Get step status for stepper
  const getStepStatus = (index) => {
    const step = steps[index];
    if (step.status === 'completed') return 'completed';
    if (step.status === 'failed') return 'error';
    if (index < getActiveStep()) return 'active';
    return 'pending';
  };

  return (
    <Container maxWidth="xl" className="view-report-container">
      <Paper 
        elevation={3}
        className="view-report-paper"
        sx={{ backgroundColor: 'background.paper' }}
      >
        <Box className="view-report-back-button-container">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            className="back-button"
          >
            Back to Dashboard
          </Button>
        </Box>

        {loading ? (
          <Box className="view-report-loading-container">
            <CircularProgress size={60} thickness={5} />
            <Typography variant="h6" className="loading-text">
              Loading report...
            </Typography>
          </Box>
        ) : error ? (
          <Box className="view-report-error-container">
            <Typography variant="h6" color="error" className="error-title">
              Error Loading Report
            </Typography>
            <Typography variant="body1" className="error-message">
              {error}
            </Typography>
          </Box>
        ) : !report ? (
          <Box className="view-report-no-data-container">
            <Typography variant="h6" className="no-data-text">
              No report found
            </Typography>
          </Box>
        ) : (
          <Box className="view-report-content">
            {/* Status Stepper */}
            <Box mb={4} p={2} bgcolor="background.default" borderRadius={1}>
              <Stepper activeStep={getActiveStep()}>
                {steps.map((step, index) => (
                  <Step key={step.label} completed={step.status === 'completed'}>
                    <StepLabel error={step.status === 'failed'}>
                      <Box>
                        {step.label}
                        {step.status !== 'completed' && step.status !== 'failed' && (
                          <Box display="flex" alignItems="center" mt={1}>
                            <CircularProgress 
                              size={16} 
                              thickness={5} 
                              variant={step.progress > 0 ? "determinate" : "indeterminate"}
                              value={step.progress}
                            />
                            <Typography variant="caption" ml={1}>
                              {step.progress > 0 ? `${step.progress}%` : 'Processing...'}
                            </Typography>
                          </Box>
                        )}
                        {step.status === 'failed' && (
                          <Typography variant="caption" color="error">Failed</Typography>
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            <ViewReportReportHeaderComponent report={report} />
            <ViewReportReportMetadataComponent report={report} formatDate={formatDate} />
            
            <Box className="view-report-sections" mt={4}>
              <ViewReportCommitListComponent 
                commits={report.commits || []} 
                formatDate={formatDate}
                summaryStatus={summaryStatus}
                summaryProgress={summaryProgress}
              />
              
              {/* Only show report content if it exists and summaries are complete */}
              {report.content && summaryStatus === 'completed' && (
                <Paper className="report-content" sx={{ mt: 3, p: 3, bgcolor: 'background.paper' }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Report Content
                  </Typography>
                  <Typography variant="body1" component="div" className="report-text">
                    {report.content.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </Typography>
                </Paper>
              )}
              
              {reportStatus !== 'completed' && summaryStatus === 'completed' && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  Report content is being generated. Progress: {reportProgress}%
                </Alert>
              )}
              
              <ViewReportPDFPreviewComponent
                report={report}
                pdfStatus={pdfStatus}
                pdfProgress={pdfProgress}
                pdfPreviewFailed={pdfPreviewFailed}
                iframeRef={iframeRef}
                handleIframeLoad={handleIframeLoad}
                handleIframeError={handleIframeError}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ViewReportComponentTemplate; 