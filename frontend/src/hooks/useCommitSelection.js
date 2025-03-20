import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useModalStore from '../store/modalStore';

/**
 * Custom hook for managing commit selection functionality
 * Handles commit selection and report generation
 */
const useCommitSelection = () => {
  const navigate = useNavigate();
  const modalStore = useModalStore();
  
  // Extract modal data from the store
  const viewCommitsOpen = modalStore.openModals['viewCommits'] || false;
  const modalData = modalStore.modalData['viewCommits'] || {};
  console.log('ViewCommits modal data:', modalData);
  
  const { reportData = {}, commits = [], selectedCommits: initialSelectedCommits = [] } = modalData;
  console.log('Extracted reportData:', reportData);

  // Local state
  const [selectedCommits, setSelectedCommits] = useState(initialSelectedCommits);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commitsData, setCommitsData] = useState(null);
  const [loadingCommits, setLoadingCommits] = useState(true);

  // Fetch commits when component mounts
  useEffect(() => {
    const fetchFilteredCommits = async () => {
      try {
        console.log('Report data before API call:', reportData);
        
        // Check if reportData has necessary properties
        if (!reportData || !reportData.repository) {
          console.error('Report data is missing required properties');
          setError('Missing repository information. Please go back and try again.');
          setLoadingCommits(false);
          return;
        }
        
        const response = await api.getCommitsByFilters({
          repository: reportData.repository,
          branches: Array.isArray(reportData.branches) 
            ? reportData.branches.map(branch => typeof branch === 'object' ? branch.name : branch)
            : [],
          authors: reportData.authors || [],
          startDate: reportData.startDate ? reportData.startDate.toISOString() : null,
          endDate: reportData.endDate ? reportData.endDate.toISOString() : null
        });
        setCommitsData(response.data);
      } catch (err) {
        console.error('Error fetching commits:', err);
        setError('Failed to load commits. Please try again.');
      } finally {
        setLoadingCommits(false);
      }
    };

    if (viewCommitsOpen) {
      fetchFilteredCommits();
    }
  }, [viewCommitsOpen, reportData]);

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
    // Save selected commits to the store
    modalStore.updateModalData('viewCommits', { selectedCommits });
    modalStore.closeModal('viewCommits');
    modalStore.openModal('createReport', { ...reportData, selectedCommits });
  };

  // Handle closing the modal
  const handleClose = () => {
    modalStore.updateModalData('viewCommits', { selectedCommits });
    modalStore.closeModal('viewCommits');
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
      modalStore.closeModal('viewCommits');
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
    commitsData,
    loadingCommits,
    
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