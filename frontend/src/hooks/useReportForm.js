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
  const { openModal, modalData, openModals, closeModal } = useModalStore();
  const reportData = modalData['createReport'] || {};
  const open = openModals['createReport'] || false;

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

  // Track if initial data has been loaded
  const initializedRef = useRef(false);
  
  // Initialize form data from modal data if available
  useEffect(() => {
    // Only run this when reportData changes and has content
    // Skip empty objects or subsequent updates to the same data
    if (reportData && 
        Object.keys(reportData).length > 0 && 
        !initializedRef.current) {
      initializedRef.current = true;
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
    // Only run this effect when dateRange has been loaded
    if (!dateRange || isLoadingDateRange) return;
    
    // Get adjusted dates based on date range
    const { startDate, endDate } = getAdjustedDates(formData.startDate, formData.endDate);
    
    // Update form if dates have changed and they're not already equal
    // Deep equality check to avoid unnecessary updates
    const datesChanged = 
      (startDate !== null && endDate !== null) && // Ensure we have valid dates
      ((startDate === null && formData.startDate !== null) ||
       (endDate === null && formData.endDate !== null) ||
       (startDate !== null && startDate.getTime() !== (formData.startDate && formData.startDate.getTime())) ||
       (endDate !== null && endDate.getTime() !== (formData.endDate && formData.endDate.getTime())));
       
    if (datesChanged) {
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    }
  }, [dateRange, formData.startDate, formData.endDate, getAdjustedDates, isLoadingDateRange]);

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
      
      // Store report data in modal store
      openModal('createReport', formData);
      
      // Open the ViewCommits modal with the form data
      openViewCommitsModal(formData);
    } catch (err) {
      console.error('Error preparing report:', err);
      setError(`Error preparing report: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingViewCommits(false);
    }
  };
  
  // Handle closing the modal
  const handleClose = () => {
    // This would be handled by the modal component directly
    closeModal('createReport');
    setFormSubmitted(false);
    setError(null);
  };
  
  const openViewCommitsModal = (data) => {
    console.log('Opening ViewCommits modal with data:', data);
    // Explicitly structure the data with reportData property
    openModal('viewCommits', { 
      reportData: data 
    });
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
    open,
    
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