import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from '../services/toast';
import useModalStore from '../store/modalStore';
import { shallow } from 'zustand/shallow';

/**
 * Custom hook for managing dashboard state and functionality
 * Handles report fetching, deletion, and navigation
 */
const useDashboard = () => {
  // Use stable selectors with shallow equality check
  const { isAuthenticated, loading: authLoading } = useAuthStore(
    (state) => ({
      isAuthenticated: state.isAuthenticated,
      loading: state.loading
    }),
    shallow // Use shallow equality to prevent unnecessary rerenders
  );
  
  // Use openModal directly to avoid selector issues
  const openModal = useModalStore((state) => state.openModal);
  
  const navigate = useNavigate();
  const theme = useTheme();
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
  const fetchReports = useCallback(async () => {
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
  }, []);

  // Fetch reports on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated, fetchReports]);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const handleOpenDeleteDialog = useCallback((report, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteDialog({ open: true, report });
    setConfirmationName('');
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, report: null });
    setConfirmationName('');
  }, []);

  const handleDeleteReport = useCallback(async () => {
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
  }, [confirmationName, deleteDialog, handleCloseDeleteDialog]);

  const handleViewReport = useCallback((reportId) => {
    navigate(`/reports/${reportId}`);
  }, [navigate]);

  const openCreateReportModal = useCallback(() => {
    openModal('createReport');
  }, [openModal]);

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