import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from '../services/toast';
import useModalStore from '../store/modalStore';

/**
 * Custom hook for managing dashboard state and functionality
 * Handles report fetching, deletion, and navigation
 */
const useDashboard = () => {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const { openModal } = useModalStore();
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
    const { report } = deleteDialog;
    if (!report) return;
    
    // Verify the confirmation name matches the report title
    if (confirmationName !== report.title) {
      toast.error('Report name does not match. Deletion cancelled.');
      return;
    }
    
    try {
      setIsDeleting(true);
      await api.deleteReport(report.id);
      setReports(prev => prev.filter(r => r.id !== report.id));
      toast.success('Report deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const openCreateReportModal = () => {
    openModal('createReport');
  };

  return {
    // State
    reports,
    loading,
    error,
    theme,
    deleteDialog,
    confirmationName,
    isDeleting,
    
    // Handlers
    fetchReports,
    formatDate,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteReport,
    handleViewReport,
    setConfirmationName,
    openCreateReportModal
  };
};

export default useDashboard; 