import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fade,
  Grid,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink } from 'react-router-dom';
import LayoutComponent from '../components/LayoutComponent';
import api from '../services/api';
import {
  ReportHeaderComponent,
  ReportMetadataComponent,
  CommitListComponent,
  PDFPreviewComponent
} from '../components/ViewReport';

/**
 * Page component for viewing a generated report
 */
const ViewReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add these state variables to track PDF generation status
  const [pdfStatus, setPdfStatus] = useState('loading');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfPollInterval, setPdfPollInterval] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const fetchedReport = await api.getReportById(id);
        
        // Initialize authors set with any existing report authors
        const authors = new Set();
        if (fetchedReport.author) {
          fetchedReport.author.split(', ').forEach(author => authors.add(author));
        }
        
        // Fetch commit details if we have commits
        if (fetchedReport.commits?.length > 0) {
          const commitIds = fetchedReport.commits.map(commit => 
            commit.sha || commit.commitId || commit.id
          ).filter(Boolean);
          
          if (commitIds.length > 0) {
            try {
              // Try to get detailed commit info with author and summary
              const commitDetails = await api.getCommitDetails({
                repository: fetchedReport.repository,
                commitIds
              });
              
              // Log the details to debug
              console.log('Commit details received:', commitDetails);
              
              // Merge the commit details with the existing commits
              fetchedReport.commits = fetchedReport.commits.map(commit => {
                const commitId = commit.sha || commit.commitId || commit.id;
                const details = commitDetails.find(c => c.commitId === commitId || c.id === commitId);
                console.log(`Mapping commit ${commitId}:`, { 
                  originalCommit: commit,
                  matchedDetails: details 
                });
                
                // Add author to the set if available
                if (details?.author?.name) {
                  authors.add(details.author.name);
                } else if (details?.author?.login) {
                  authors.add(details.author.login);
                } else if (typeof details?.author === 'string') {
                  authors.add(details.author);
                }
                
                return details ? { ...commit, ...details } : commit;
              });
              
              // Log the merged commits
              console.log('Merged commits with details:', fetchedReport.commits);
              
              // Update the report's allAuthors
              fetchedReport.allAuthors = Array.from(authors);
              console.log('Extracted authors:', fetchedReport.allAuthors);
            } catch (detailsErr) {
              console.error('Error fetching commit details:', detailsErr);
              // Fallback to basic commit info if detailed info fails
              try {
                const commitInfo = await api.getCommitInfo({
                  repository: fetchedReport.repository,
                  commitIds
                });
                
                // Merge the commit info with the existing commits
                fetchedReport.commits = fetchedReport.commits.map(commit => {
                  const commitId = commit.sha || commit.commitId || commit.id;
                  const info = commitInfo.find(c => c.sha === commitId);
                  
                  // Add author to the set if available
                  if (info?.author?.name) {
                    authors.add(info.author.name);
                  } else if (info?.author?.login) {
                    authors.add(info.author.login);
                  } else if (typeof info?.author === 'string') {
                    authors.add(info.author);
                  }
                  
                  return info ? { ...commit, ...info } : commit;
                });
                
                // Update the report's allAuthors
                fetchedReport.allAuthors = Array.from(authors);
              } catch (infoErr) {
                console.error('Error fetching commit info:', infoErr);
              }
            }
          }
        }
        
        setReport(fetchedReport);
        setError(null);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  // Add this useEffect to poll for PDF generation status
  useEffect(() => {
    // Function to check PDF generation status
    const checkPdfStatus = async () => {
      if (!id || !report || (report.pdfUrl && report.pdfUrl !== 'pending' && report.pdfUrl !== 'failed')) {
        // If we have a complete PDF URL, no need to poll
        clearInterval(pdfPollInterval);
        setPdfPollInterval(null);
        return;
      }

      try {
        const statusResponse = await api.getPdfStatus(id);
        console.log('PDF Status:', statusResponse);
        
        setPdfStatus(statusResponse.status);
        if (statusResponse.progress) {
          setPdfProgress(statusResponse.progress);
        }
        
        // If complete or failed, stop polling
        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          clearInterval(pdfPollInterval);
          setPdfPollInterval(null);
          
          // If completed, update the report with the new URLs
          if (statusResponse.status === 'completed' && statusResponse.viewUrl && statusResponse.downloadUrl) {
            setReport(prev => ({
              ...prev,
              viewUrl: statusResponse.viewUrl,
              downloadUrl: statusResponse.downloadUrl
            }));
          }
        }
      } catch (error) {
        console.error('Error checking PDF status:', error);
      }
    };

    // Start polling when component mounts and we have an ID
    if (id && report && !pdfPollInterval && (report.pdfUrl === 'pending' || report.pdfJobId)) {
      // Check immediately
      checkPdfStatus();
      
      // Then set up interval (every 3 seconds)
      const interval = setInterval(checkPdfStatus, 3000);
      setPdfPollInterval(interval);
    }

    // Clean up interval on unmount
    return () => {
      if (pdfPollInterval) {
        clearInterval(pdfPollInterval);
      }
    };
  }, [id, report, pdfPollInterval]);

  if (loading) {
    return (
      <LayoutComponent title="Loading Report...">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress 
            size={60}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
        </Box>
      </LayoutComponent>
    );
  }

  if (error) {
    return (
      <LayoutComponent title="Error">
        <Alert 
          severity="error"
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(211, 47, 47, 0.3)',
            mb: 3
          }}
        >
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/dashboard"
            sx={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </LayoutComponent>
    );
  }

  if (!report) {
    return (
      <LayoutComponent title="Report Not Found">
        <Alert 
          severity="info"
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(3, 169, 244, 0.3)',
            mb: 3
          }}
        >
          The requested report could not be found.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/dashboard"
            sx={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent title={report.name}>
      <Fade in={true} timeout={800}>
        <Box>
          <ReportHeaderComponent report={report} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ReportMetadataComponent report={report} />
            </Grid>

            {/* Commit List Section */}
            <Grid item xs={12}>
              <CommitListComponent commits={report.commits || []} />
            </Grid>

            {/* PDF Preview Section */}
            {report && (
              <Grid item xs={12}>
                <PDFPreviewComponent 
                  report={report} 
                  pdfStatus={pdfStatus} 
                  pdfProgress={pdfProgress} 
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>
    </LayoutComponent>
  );
};

export default ViewReportPage; 