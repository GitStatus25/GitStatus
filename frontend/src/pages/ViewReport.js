import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  // eslint-disable-next-line no-unused-vars
  Dialog,
  // eslint-disable-next-line no-unused-vars
  DialogActions,
  // eslint-disable-next-line no-unused-vars
  DialogContent,
  // eslint-disable-next-line no-unused-vars
  DialogContentText,
  // eslint-disable-next-line no-unused-vars
  DialogTitle,
  Divider,
  Fade,
  Grid,
  Paper,
  // eslint-disable-next-line no-unused-vars
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // eslint-disable-next-line no-unused-vars
  TextField,
  Typography,
  useTheme,
  Tooltip,
  // eslint-disable-next-line no-unused-vars
  IconButton,
  Zoom
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
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
  // eslint-disable-next-line no-unused-vars
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [confirmationName, setConfirmationName] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const fetchedReport = await api.getReportById(id);
        
        // Fetch commit details if we have commits
        if (fetchedReport.commits?.length > 0) {
          const commitIds = fetchedReport.commits.map(commit => 
            commit.id || commit.sha || commit.hash || commit.commitId
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
                const commitId = commit.id || commit.sha || commit.hash || commit.commitId;
                const details = commitDetails.find(c => c.id === commitId);
                console.log(`Mapping commit ${commitId}:`, { 
                  originalCommit: commit,
                  matchedDetails: details 
                });
                return details ? { ...commit, ...details } : commit;
              });
              
              // Log the merged commits
              console.log('Merged commits with details:', fetchedReport.commits);
              
              // Extract all unique authors for the authors card
              const authors = new Set();
              fetchedReport.commits.forEach(commit => {
                if (commit.author?.name) {
                  authors.add(commit.author.name);
                } else if (commit.author?.login) {
                  authors.add(commit.author.login);
                } else if (typeof commit.author === 'string') {
                  authors.add(commit.author);
                }
              });
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
                  const commitId = commit.id || commit.sha || commit.hash || commit.commitId;
                  const info = commitInfo.find(c => c.id === commitId);
                  return info ? { ...commit, ...info } : commit;
                });
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

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // eslint-disable-next-line no-unused-vars
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // eslint-disable-next-line no-unused-vars
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setConfirmationName('');
  };

  // eslint-disable-next-line no-unused-vars
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteReport = async () => {
    if (!report || !confirmationName) return;
    
    try {
      setIsDeleting(true);
      await api.deleteReport(id, confirmationName);
      setSnackbar({
        open: true,
        message: `Report "${report.name}" successfully deleted`,
        severity: 'success'
      });
      setDeleteDialogOpen(false);
      
      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error deleting report:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to delete report',
        severity: 'error'
      });
      setIsDeleting(false);
    }
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
              
              <Tooltip title="Delete this report">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleOpenDeleteDialog}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'rgba(244, 67, 54, 0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      borderColor: 'error.main'
                    }
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
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
            {report.downloadUrl && (
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
                        overflow: 'hidden'
                      }}
                    >
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(report.downloadUrl)}&embedded=true`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                        title="Report Document Viewer"
                      ></iframe>
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