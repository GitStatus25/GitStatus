import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Zoom
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GitHubIcon from '@mui/icons-material/GitHub';
import Layout from '../../components/Layout';
import './DashboardComponent.css';

const DashboardComponentTemplate = ({
  reports,
  loading,
  error,
  handleOpenDeleteDialog,
  handleCloseDeleteDialog,
  handleDeleteReport,
  deleteDialog,
  confirmationName,
  setConfirmationName,
  isDeleting,
  formatDate,
  openCreateReportModal,
  theme
}) => {
  return (
    <Layout title="Dashboard">
      <Grid container spacing={3} className="fade-in">
        <Grid item xs={12}>
          <Box className="dashboard-header">
            <Box className="dashboard-title-container">
              <DescriptionIcon 
                className="dashboard-icon"
                sx={{ color: theme.palette.primary.main }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                className="dashboard-title"
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
                className="create-report-button"
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.light'
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
              className="error-alert"
            >
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card 
            elevation={2}
            className="reports-card"
          >
            <CardContent sx={{ py: 3 }}>
              <Divider sx={{ mb: 3 }} />

              {loading ? (
                <Box className="loading-container">
                  <CircularProgress 
                    color="primary" 
                    className="loading-progress"
                  />
                </Box>
              ) : !reports || reports.length === 0 ? (
                <Box className="empty-reports-container">
                  <DescriptionIcon className="empty-reports-icon" />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    You haven't created any reports yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Get started by creating your first report.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={openCreateReportModal}
                    sx={{ mt: 2 }}
                  >
                    Create Report
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} className="report-table-container">
                  <Table sx={{ minWidth: 650 }} aria-label="reports table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Report Name</TableCell>
                        <TableCell>Repository</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow 
                          key={report.id} 
                          className="report-table-row"
                        >
                          <TableCell component="th" scope="row">
                            <Link 
                              component={RouterLink} 
                              to={`/reports/${report.id}`}
                              className="report-link"
                            >
                              <Typography className="report-title">
                                {report.name || report.title || 'Untitled Report'}
                              </Typography>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GitHubIcon sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
                              {report.repository || 'Unknown Repository'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
                              {formatDate(report.createdAt)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={report.pdfUrl === 'pending' ? 'Processing' : 'Ready'} 
                              color={report.pdfUrl === 'pending' ? 'warning' : 'success'}
                              size="small"
                              className="report-chip"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {report.pdfUrl && report.pdfUrl !== 'pending' && (
                                <Tooltip title="Download PDF">
                                  <IconButton 
                                    component={RouterLink}
                                    to={report.pdfUrl}
                                    target="_blank"
                                    className="report-action-button download-button"
                                    size="small"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete Report">
                                <IconButton 
                                  onClick={(e) => handleOpenDeleteDialog(report, e)}
                                  className="report-action-button delete-button"
                                  size="small"
                                >
                                  <DeleteIcon />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent className="dialog-content">
          <DialogContentText>
            This action cannot be undone. This will permanently delete the report
            <strong>{deleteDialog.report ? ` "${deleteDialog.report.title || deleteDialog.report.name}"` : ''}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            To confirm, please type the name of the report:
          </DialogContentText>
          <TextField
            className="delete-confirmation-input"
            fullWidth
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={deleteDialog.report ? deleteDialog.report.title || deleteDialog.report.name : ''}
            variant="outlined"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteReport} 
            color="error"
            disabled={
              isDeleting || 
              !deleteDialog.report || 
              !confirmationName || 
              confirmationName !== (deleteDialog.report?.title || deleteDialog.report?.name)
            }
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DashboardComponentTemplate; 