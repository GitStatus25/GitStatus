import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fade,
  Grid,
  Typography,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Layout from '../PagePartials/Layout';
import {
  ViewReportReportHeaderComponent,
  ViewReportReportMetadataComponent,
  ViewReportCommitListComponent,
  ViewReportPDFPreviewComponent
} from '../PagePartials/ViewReport';
import './ViewReportComponent.css';

const ViewReportComponentTemplate = ({
  loading,
  error,
  report,
  pdfStatus,
  pdfProgress,
  handleNavigateBack
}) => {
  if (loading) {
    return (
      <Layout title="Loading Report...">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress 
            size={60}
            thickness={4}
            className="loading-spinner"
          />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Error">
        <Alert className="error-alert" severity="error">
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/dashboard"
            className="back-button"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Report Not Found">
        <Alert className="info-alert" severity="info">
          The requested report could not be found.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/dashboard"
            className="back-button"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={report.name}>
      <Fade in={true} timeout={800}>
        <Box className="view-report-container">
          <ViewReportReportHeaderComponent report={report} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ViewReportReportMetadataComponent report={report} />
            </Grid>

            {/* Commit List Section */}
            <Grid item xs={12}>
              <ViewReportCommitListComponent commits={report.commits || []} />
            </Grid>

            {/* PDF Preview Section */}
            {report && (
              <Grid item xs={12}>
                <ViewReportPDFPreviewComponent 
                  report={report} 
                  pdfStatus={pdfStatus} 
                  pdfProgress={pdfProgress} 
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>
    </Layout>
  );
};

export default ViewReportComponentTemplate; 