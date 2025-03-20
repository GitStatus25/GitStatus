import { useState, useEffect, useRef } from 'react';
import api from '../services/api.js';
import useModalStore from '../store/modalStore';
import useRepositorySearch from './useRepositorySearch.js';
import useAuthorSelection from './useAuthorSelection.js';
import useDateRange from './useDateRange.js';

/**
 * Custom hook for managing the report creation form state and logic
 * Handles repository selection, branch and author filtering, date ranges,
 * and form validation
 */
const useReportForm = () => {
  const { openModal } = useModalStore();

  // Form data state
  const [formData, setFormData] = useState({
    repository: '',
    branches: [],
    authors: [],
    startDate: null,
    endDate: null,
    title: '',
    includeCode: true
  });

  // Initialize form data from context if available
  useEffect(() => {
    if (reportData) {
      setFormData(prevData => ({ ...prevData, ...reportData }));
    }
  }, [reportData]);

  // Repository data state
  const [repositoryInfo, setRepositoryInfo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [repositoryValid, setRepositoryValid] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loadingViewCommits, setLoadingViewCommits] = useState(false);

  // Use the repository search hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searching
  } = useRepositorySearch();
  
  // Use the author selection hook
  const {
    availableAuthors,
    isLoadingAuthors,
    filterSelectedAuthors
  } = useAuthorSelection(formData.repository, formData.branches, repositoryValid);
  
  // Use the date range hook
  const {
    dateRange,
    isLoadingDateRange,
    getAdjustedDates
  } = useDateRange(formData.repository, formData.branches, formData.authors, repositoryValid);
  
  // Update authors when they may have changed due to branch selection
  useEffect(() => {
    // Filter out selected authors that are no longer available
    const filteredAuthors = filterSelectedAuthors(formData.authors);
    
    if (filteredAuthors.length !== formData.authors.length) {
      setFormData(prev => ({
        ...prev,
        authors: filteredAuthors
      }));
    }
  }, [availableAuthors, formData.authors, filterSelectedAuthors]);
  
  // Update dates when date range changes
  useEffect(() => {
    // Get adjusted dates based on date range
    const { startDate, endDate } = getAdjustedDates(formData.startDate, formData.endDate);
    
    // Update form if dates have changed
    if (
      startDate !== formData.startDate || 
      endDate !== formData.endDate
    ) {
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    }
  }, [dateRange, formData.startDate, formData.endDate, getAdjustedDates]);

  // Handle repository selection
  const handleRepositorySelect = async (repo) => {
    if (!repo) {
      setFormData(prev => ({ ...prev, repository: '', branches: [] }));
      setRepositoryValid(false);
      setBranches([]);
      return;
    }
    
    setFormData(prev => ({ ...prev, repository: repo, branches: [] }));
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch repository info and branches
      const [repoInfo, repoBranches] = await Promise.all([
        api.getRepositoryInfo(repo),
        api.getBranches(repo)
      ]);
      
      setRepositoryInfo(repoInfo);
      setBranches(repoBranches);
      setRepositoryValid(true);
    } catch (err) {
      console.error('Error fetching repository data:', err);
      setFormData(prev => ({ ...prev, repository: '', branches: [] }));
      setRepositoryValid(false);
      setBranches([]);
      setError('Repository not found or inaccessible');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle branch selection changes
  const handleBranchesChange = (newBranches) => {
    setFormData(prev => ({ ...prev, branches: newBranches, authors: [] }));
  };
  
  // Handle author selection changes
  const handleAuthorsChange = (newAuthors) => {
    setFormData(prev => ({ ...prev, authors: newAuthors }));
  };
  
  // Handle date changes
  const handleDateChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };
  
  // Validate form data
  const validateForm = () => {
    const { repository, branches, title, startDate, endDate } = formData;
    
    // Basic validation
    if (!repository || !repositoryValid) return false;
    if (!branches.length) return false;
    if (!title) return false;
    if (!startDate || !endDate) return false;
    
    // Validate date range
    if (startDate > endDate) return false;
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setFormSubmitted(true);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoadingViewCommits(true);
      setError(null);
      
      // Store report data in context
      updateReportData(formData);
      
      // Close this modal and open the ViewCommits modal
      closeModals();
      openViewCommitsModal();
    } catch (err) {
      console.error('Error preparing report:', err);
      setError(`Error preparing report: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingViewCommits(false);
    }
  };
  
  // Handle closing the modal
  const handleClose = () => {
    closeModals();
    
    // Reset form state
    setFormSubmitted(false);
    setError(null);
  };
  
  const openViewCommitsModal = (data) => {
    openModal('viewCommits', data);
  };
  
  return {
    // Form state
    formData,
    repositoryValid,
    branches,
    availableAuthors,
    searchQuery,
    searchResults,
    searching,
    isLoadingAuthors,
    isLoadingDateRange,
    dateRange,
    error,
    formSubmitted,
    loadingViewCommits,
    
    // Modal state
    open: createReportOpen,
    
    // Handlers
    handleInputChange,
    handleRepositorySelect,
    handleBranchesChange,
    handleAuthorsChange,
    handleDateChange,
    handleCheckboxChange,
    handleSubmit,
    handleClose,
    setSearchQuery,
    validateForm
  };
};

export default useReportForm; 