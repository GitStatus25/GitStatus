import React from 'react';
import { useDashboard } from '../../hooks';
import DashboardComponentTemplate from './DashboardComponent.jsx';
import useAuthStore from '../../store/authStore';

/**
 * Dashboard component - contains only business logic
 * Using custom hooks for better separation of concerns
 */
const DashboardComponent = () => {
  const {
    reports,
    loading,
    error,
    theme,
    deleteDialog,
    confirmationName,
    isDeleting,
    formatDate,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteReport,
    setConfirmationName,
    openCreateReportModal
  } = useDashboard();

  const { user, isAuthenticated, loading: authLoading } = useAuthStore();

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