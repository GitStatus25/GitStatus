import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useModal } from '../contexts/ModalContext';

/**
 * Custom hook for managing commit selection functionality
 * Handles user stats, commit selection, and report generation
 */
const useCommitSelection = () => {
  const navigate = useNavigate();
  const {
    modalState,
    closeModals,
    openCreateReportModal,
    updateSelectedCommits
  } = useModal();

  const {
    viewCommitsOpen,
    reportData,
    commits,
    selectedCommits: initialSelectedCommits
  } = modalState;

  // Local state
  const [selectedCommits, setSelectedCommits] = useState(initialSelectedCommits || []);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user stats when component mounts
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await api.getUserStats();
        setUserStats(response.data);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load user limits. Please try again.');
      } finally {
        setLoadingStats(false);
      }
    };

    if (viewCommitsOpen) {
      fetchUserStats();
    }
  }, [viewCommitsOpen]);

  // Toggle a commit's selection status
  const toggleCommitSelection = (commitSha) => {
    setSelectedCommits(prev => {
      if (prev.includes(commitSha)) {
        return prev.filter(sha => sha !== commitSha);
      } else {
        return [...prev, commitSha];
      }
    });
  };

  // Toggle select all commits
  const toggleSelectAllCommits = () => {
    if (selectedCommits.length === commits.length) {
      // Deselect all
      setSelectedCommits([]);
    } else {
      // Select all
      setSelectedCommits(commits.map(commit => commit.sha));
    }
  };

  // Toggle expanded commit for viewing diffs
  const toggleExpandCommit = (commitSha) => {
    setExpandedCommit(expandedCommit === commitSha ? null : commitSha);
  };

  // Toggle expanded file in a commit
  const toggleExpandFile = (fileId) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  // Go back to create report modal
  const handleBackToForm = () => {
    // Save selected commits to context
    updateSelectedCommits(selectedCommits);
    openCreateReportModal();
  };

  // Handle closing the modal
  const handleClose = () => {
    updateSelectedCommits(selectedCommits);
    closeModals();
  };

  // Generate report from selected commits
  const generateReport = async () => {
    if (!selectedCommits.length) {
      setError('Please select at least one commit');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get detailed commit info including branch details
      const commitsWithInfo = await api.getCommitInfo({
        repository: reportData.repository,
        commitIds: selectedCommits
      });

      // Generate report with selected commits
      const reportParams = {
        repository: reportData.repository,
        branches: reportData.branches.map(branch => 
          typeof branch === 'object' ? branch.name : branch
        ),
        authors: reportData.authors,
        startDate: reportData.startDate ? reportData.startDate.toISOString() : null,
        endDate: reportData.endDate ? reportData.endDate.toISOString() : null,
        title: reportData.title || `${reportData.repository} Report`,
        includeCode: reportData.includeCode,
        commitIds: selectedCommits
      };

      const report = await api.generateReport(reportParams);
      
      // Close modal and navigate to the report view page
      closeModals();
      navigate(`/reports/${report.reportId || report.id}`);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    modalOpen: viewCommitsOpen,
    commits: commits || [],
    selectedCommits,
    expandedCommit,
    expandedFiles,
    loading,
    error,
    userStats,
    loadingStats,
    
    // Handlers
    toggleCommitSelection,
    toggleSelectAllCommits,
    toggleExpandCommit,
    toggleExpandFile,
    handleBackToForm,
    handleClose,
    generateReport
  };
};

export default useCommitSelection; 