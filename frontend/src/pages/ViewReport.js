import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Tooltip,
  Zoom
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import GitHubIcon from '@mui/icons-material/GitHub';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import Layout from '../components/Layout';
import api from '../services/api';

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);
  const iframeRef = useRef(null);
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

    if (report?.downloadUrl) {
      checkPdfPreview();
    }
  }, [report]);

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

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout title="Loading Report...">
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
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Error">
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
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Report Not Found">
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
      </Layout>
    );
  }

  return (
    <Layout title={report.name}>
      <Fade in={true} timeout={800}>
        <Box>
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
                  href={report.downloadUrl}
                  target="_blank"
                  disabled={!report.downloadUrl}
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

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card 
                elevation={2}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundImage: theme.palette.background.cardGradient,
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        background: 'linear-gradient(90deg, #fff, #81d4fa)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        m: 0 
                      }}
                    >
                      Report Details
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      {/* Repository Card */}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <GitHubIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">Repository</Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>{report.repository}</Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Authors Card */}
                      {report.allAuthors && report.allAuthors.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                              <Typography variant="body2" color="text.secondary">
                                {report.allAuthors.length > 1 ? 'Authors' : 'Author'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                              {report.allAuthors.map((author, index) => (
                                <Chip
                                  key={index}
                                  label={author}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: 'rgba(77, 171, 245, 0.1)',
                                    borderColor: 'rgba(77, 171, 245, 0.3)',
                                    borderRadius: '4px',
                                    '& .MuiChip-label': {
                                      padding: '0 8px'
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                      )}

                      {/* Date Range Card */}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">Date Range</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={formatDate(report.startDate)}
                              size="small"
                              sx={{ 
                                backgroundColor: 'rgba(77, 171, 245, 0.1)',
                                borderColor: 'rgba(77, 171, 245, 0.3)',
                                mr: 1
                              }}
                            />
                            <Typography variant="body2" sx={{ mx: 0.5 }}>to</Typography>
                            <Chip
                              label={formatDate(report.endDate)}
                              size="small"
                              sx={{ 
                                backgroundColor: 'rgba(77, 171, 245, 0.1)',
                                borderColor: 'rgba(77, 171, 245, 0.3)'
                              }}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                      
                      {/* Branch Card */} 
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">
                              Branch
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {report.branch || 'main'}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Created Card */}
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">Created</Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>{formatDate(report.createdAt)}</Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Access Count Card */}
                      {report.accessCount && (
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <VisibilityIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                              <Typography variant="body2" color="text.secondary">Access Count</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>{report.accessCount}</Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Commit List Section */}
            <Grid item xs={12}>
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
                    <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
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
                      Included Commits
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Commit ID</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Author</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Message</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Summary</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.commits?.map((commit) => (
                          <TableRow 
                            key={commit.id || commit._id || commit.sha}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.03)'
                              }
                            }}
                          >
                            <TableCell sx={{ 
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.875rem'
                            }}>
                              {commit.id?.substring(0, 7) || 
                               commit.sha?.substring(0, 7) || 
                               commit.hash?.substring(0, 7) || 
                               commit.commitId?.substring(0, 7) || 
                               'N/A'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
                                <Typography variant="body2">
                                  {commit.author?.name || commit.author?.login || 'Unknown'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Tooltip 
                                title={
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {commit.message || commit.description || 'No message'}
                                  </Typography>
                                }
                                arrow
                                placement="top"
                              >
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    maxWidth: 300,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  {commit.message || commit.description || 'No message'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{commit.date ? formatDate(commit.date) : (commit.timestamp ? formatDate(commit.timestamp) : 'No date')}</TableCell>
                            <TableCell>
                              <Tooltip 
                                title={
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {commit.summary || commit.aiSummary || 'No summary available'}
                                  </Typography>
                                }
                                arrow
                                placement="top"
                              >
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    maxWidth: 300,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help'
                                  }}
                                >
                                  {commit.summary || commit.aiSummary || 'No summary available'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* PDF Preview Section */}
            {report && (
              <Grid item xs={12}>
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
                      {report.pdfUrl === 'pending' || pdfStatus === 'pending' || pdfStatus === 'waiting' || pdfStatus === 'active' ? (
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
                      ) : report.pdfUrl === 'failed' || pdfStatus === 'failed' ? (
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
                      ) : report.downloadUrl && !pdfPreviewFailed ? (
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
                            {report.downloadUrl ? 
                              "Your browser doesn't support the embedded PDF viewer or the document couldn't be loaded. Please use the button below to download and view the report." :
                              "The PDF download is not available yet. Please check back later."}
                          </Typography>
                          {report.downloadUrl && (
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
              </Grid>
            )}
          </Grid>
        </Box>
      </Fade>
    </Layout>
  );
};

export default ViewReport;