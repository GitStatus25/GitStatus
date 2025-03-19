import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { useModal } from '../../contexts/ModalContext';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from '../../services/toast';
import DashboardComponentTemplate from './DashboardComponent.jsx';

/**
 * Dashboard component - contains only business logic
 */
const DashboardComponent = () => {
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

  // Pass all required props to the template
  return (
    <DashboardComponentTemplate
      reports={reports}
      loading={loading}
      error={error}
      handleOpenDeleteDialog={handleOpenDeleteDialog}
      handleCloseDeleteDialog={handleCloseDeleteDialog}
      handleDeleteReport={handleDeleteReport}
      deleteDialog={deleteDialog}
      confirmationName={confirmationName}
      setConfirmationName={setConfirmationName}
      isDeleting={isDeleting}
      formatDate={formatDate}
      openCreateReportModal={openCreateReportModal}
      theme={theme}
    />
  );
};

export default DashboardComponent; 