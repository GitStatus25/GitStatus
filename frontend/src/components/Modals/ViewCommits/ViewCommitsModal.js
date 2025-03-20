import React from 'react';
import { useCommitSelection } from '../../../hooks';
import ViewCommitsModalComponent from './ViewCommitsModal';

/**
 * ViewCommitsModal component - Modal for viewing and selecting commits for a report
 * Using custom hooks for better separation of concerns
 */
const ViewCommitsModal = () => {
  const {
    modalOpen,
    commits,
    selectedCommits,
    expandedCommit,
    expandedFiles,
    loading,
    error,
    userStats,
    loadingStats,
    toggleCommitSelection,
    toggleSelectAllCommits,
    toggleExpandCommit,
    toggleExpandFile,
    handleBackToForm,
    handleClose,
    generateReport
  } = useCommitSelection();

  return (
    <ViewCommitsModalComponent
      open={modalOpen}
      commits={commits}
      selectedCommits={selectedCommits}
      expandedCommit={expandedCommit}
      expandedFiles={expandedFiles}
      loading={loading}
      error={error}
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
