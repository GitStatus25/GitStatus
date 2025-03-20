import React from 'react';
import { useCommitSelection, useUserStats } from '../../../hooks';
import ViewCommitsModalComponent from './ViewCommitsModal.jsx';

/**
 * ViewCommitsModal component - Modal for viewing and selecting commits for a report
 * Using custom hooks for better separation of concerns
 */
const ViewCommitsModal = () => {
  // Get commit selection functionality
  const {
    modalOpen,
    commits,
    selectedCommits,
    expandedCommit,
    expandedFiles,
    loading,
    error,
    loadingCommits,
    toggleCommitSelection,
    toggleSelectAllCommits,
    toggleExpandCommit,
    toggleExpandFile,
    handleBackToForm,
    handleClose,
    generateReport
  } = useCommitSelection();

  // Get user stats from dedicated hook
  const {
    userStats,
    loading: loadingStats,
    error: statsError
  } = useUserStats();

  // Combine errors if needed
  const combinedError = error || statsError;

  return (
    <ViewCommitsModalComponent
      open={modalOpen}
      commits={commits}
      selectedCommits={selectedCommits}
      expandedCommit={expandedCommit}
      expandedFiles={expandedFiles}
      loading={loading}
      error={combinedError}
      userStats={userStats}
      loadingStats={loadingStats}
      onClose={handleClose}
      onBack={handleBackToForm}
      onToggleCommitSelection={toggleCommitSelection}
      onToggleSelectAllCommits={toggleSelectAllCommits}
      onToggleExpandCommit={toggleExpandCommit}
      onToggleExpandFile={toggleExpandFile}
      onGenerateReport={generateReport}
    />
  );
};

export default ViewCommitsModal;
