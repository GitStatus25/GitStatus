import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  CircularProgress, 
  Link,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Chip,
  useTheme,
  Zoom
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GitHubIcon from '@mui/icons-material/GitHub';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from '../services/toast'; // Import toast
import { useModal } from '../contexts/ModalContext';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const { openCreateReportModal } = useModal();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, report: null });
  const [confirmationName, setConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Function to fetch user's reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const fetchedReports = await api.getReports();
      setReports(fetchedReports);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleOpenDeleteDialog = (report, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteDialog({ open: true, report });
    setConfirmationName('');
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, report: null });
    setConfirmationName('');
  };

  const handleDeleteReport = async () => {
    if (!deleteDialog.report) return;
    
    try {
      setIsDeleting(true);
      await api.deleteReport(deleteDialog.report.id, confirmationName);
      
      // Remove the deleted report from state
      setReports(reports.filter(r => r.id !== deleteDialog.report.id));
      
      // Show success message
      toast.success(`Report "${deleteDialog.report.title || deleteDialog.report.name}" successfully deleted`);
      
      // Close dialog
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error(err.response?.data?.error || 'Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout title="Dashboard">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={3}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              pb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon 
                sx={{ 
                  fontSize: 28, 
                  mr: 1.5, 
                  color: theme.palette.primary.main 
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  background: 'linear-gradient(90deg, #fff, #81d4fa)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 600
                }}
              >
                Your Reports
              </Typography>
            </Box>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={openCreateReportModal}
                startIcon={<AddIcon />}
                sx={{
                  px: 3,
                  py: 1.2,
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(77, 171, 245, 0.4)',
                    bgcolor: 'primary.light'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 12px rgba(77, 171, 245, 0.3)',
                  }
                }}
              >
                Create New Report
              </Button>
            </Zoom>
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert 
              severity="error"
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(211, 47, 47, 0.3)'
              }}
            >
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card 
            elevation={2}
            sx={{
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Divider sx={{ mb: 3 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress 
                    color="primary" 
                    sx={{
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }}
                  />
                </Box>
              ) : !reports || reports.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    background: 'rgba(77, 171, 245, 0.02)',
                    borderRadius: 4
                  }}
                >
                  <DescriptionIcon sx={{ 
                    fontSize: 64, 
                    color: 'text.secondary', 
                    mb: 3,
                    opacity: 0.7
                  }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    You haven't created any reports yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                    Generate detailed Git activity reports for your repositories to track contributions and analyze development patterns.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={openCreateReportModal}
                    sx={{ 
                      mt: 2,
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    Create New Report
                  </Button>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    background: 'transparent',
                    '& .MuiTable-root': {
                      borderCollapse: 'separate',
                      borderSpacing: '0 8px',
                    }
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 4, p: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}></TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Report Name</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Repository</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Date Range</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Created</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow 
                          key={report.id || report._id}
                          sx={{
                            background: theme.palette.background.cardGradient,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            borderRadius: 2,
                            position: 'relative',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              '& .row-highlight': {
                                opacity: 1,
                              }
                            },
                            '& td:first-of-type': { 
                              borderTopLeftRadius: 8, 
                              borderBottomLeftRadius: 8,
                            },
                            '& td:last-of-type': { 
                              borderTopRightRadius: 8, 
                              borderBottomRightRadius: 8,
                            },
                          }}
                        >
                          <TableCell sx={{ width: 4, p: 0, border: 'none' }}>
                            <Box 
                              className="row-highlight"
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: 4,
                                height: '100%',
                                bgcolor: 'primary.main',
                                borderRadius: '4px 0 0 4px',
                                opacity: 0,
                                transition: 'opacity 0.2s ease-in-out',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none', py: 2.5 }}>
                            <Link 
                              component={RouterLink} 
                              to={`/reports/${report.id || report._id}`}
                              underline="none"
                              color="primary"
                              sx={{
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                                '&:hover': {
                                  color: theme.palette.primary.light,
                                }
                              }}
                            >
                              <DescriptionIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                              {report.title || report.name || 'Untitled Report'}
                            </Link>
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GitHubIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                              <Typography variant="body2">{report.repository}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Chip
                              icon={<CalendarTodayIcon sx={{ fontSize: '16px !important' }} />}
                              label={`${formatDate(report.startDate)} - ${formatDate(report.endDate)}`}
                              variant="outlined"
                              size="small"
                              sx={{ 
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiChip-label': { px: 1 },
                                '& .MuiChip-icon': { ml: 1 }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {formatDate(report.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ borderBottom: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {report.downloadUrl ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  href={report.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ 
                                    mr: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.15)',
                                    '&:hover': {
                                      borderColor: theme.palette.primary.main,
                                      backgroundColor: 'rgba(77, 171, 245, 0.08)',
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  disabled
                                  startIcon={<TrendingUpIcon sx={{ animation: 'pulse 1.5s infinite ease-in-out' }} />}
                                  sx={{ 
                                    mr: 1,
                                    '@keyframes pulse': {
                                      '0%': { opacity: 0.6 },
                                      '50%': { opacity: 1 },
                                      '100%': { opacity: 0.6 }
                                    }
                                  }}
                                >
                                  Generating
                                </Button>
                              )}
                              
                              <Tooltip title="Delete Report">
                                <IconButton 
                                  color="error" 
                                  size="small"
                                  onClick={(e) => handleOpenDeleteDialog(report, e)}
                                  sx={{
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Delete Report Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            backgroundImage: theme.palette.background.cardGradient,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          Delete Report
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Are you sure you want to delete this report? This action cannot be undone.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.light' }}>
            To confirm, please type the report name:
            <Typography component="span" sx={{ fontWeight: 'bold', display: 'block', my: 1 }}>
              {deleteDialog.report?.title || deleteDialog.report?.name || 'Untitled Report'}
            </Typography>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            variant="outlined"
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.error.main,
                  borderWidth: 2,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteReport}
            color="error"
            variant="contained"
            disabled={
              confirmationName !== (deleteDialog.report?.title || deleteDialog.report?.name || 'Untitled Report') || 
              isDeleting
            }
            sx={{
              '&.Mui-disabled': {
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
