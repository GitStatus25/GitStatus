import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api.js';
import { useModal } from '../../../contexts/ModalContext.js';

/**
 * Custom hook for managing the report creation form state and logic
 * Handles repository selection, branch and author filtering, date ranges,
 * and form validation
 */
const useReportForm = () => {
  const { 
    modalState, 
    closeModals, 
    updateReportData, 
    openViewCommitsModal 
  } = useModal();

  const { createReportOpen, reportData } = modalState;

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
  const [availableAuthors, setAvailableAuthors] = useState([]);
  const [repositoryValid, setRepositoryValid] = useState(false);
  
  // Repository search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Date constraint state
  const [dateRange, setDateRange] = useState({
    firstCommitDate: null,
    lastCommitDate: null
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loadingViewCommits, setLoadingViewCommits] = useState(false);

  // Caching mechanism for API calls
  const apiCache = useRef({
    authors: {},
    dateRanges: {}
  });
  
  // Debounce timers
  const authorsDebounceTimer = useRef(null);
  const dateRangeDebounceTimer = useRef(null);

  // Handle repository search
  useEffect(() => {
    const searchRepositories = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setSearching(true);
        const repos = await api.searchRepositories(searchQuery);
        setSearchResults(repos);
      } catch (err) {
        console.error('Repository search error:', err);
      } finally {
        setSearching(false);
      }
    };
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      searchRepositories();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Update authors when branches change
  useEffect(() => {
    const updateAvailableAuthors = async () => {
      const { repository, branches } = formData;
      
      if (!repository || !repositoryValid || !branches.length) {
        setAvailableAuthors([]);
        return;
      }
      
      try {
        setIsLoadingAuthors(true);
        const branchNames = branches.map(branch => typeof branch === 'object' ? branch.name : branch);
        
        // Create a cache key based on repository and branches
        const cacheKey = `${repository}:${branchNames.sort().join(',')}`;
        
        // Check if we have cached results
        if (apiCache.current.authors[cacheKey]) {
          setAvailableAuthors(apiCache.current.authors[cacheKey]);
        } else {
          // Fetch from API if not cached
          const authors = await api.getAuthorsForBranches(repository, branchNames);
          
          // Cache the results
          apiCache.current.authors[cacheKey] = authors;
          setAvailableAuthors(authors);
        }
        
        // Filter out selected authors that are no longer available
        setFormData(prev => ({
          ...prev,
          authors: prev.authors.filter(author => 
            apiCache.current.authors[cacheKey].includes(author)
          )
        }));
      } catch (err) {
        console.error('Error fetching authors:', err);
        setAvailableAuthors([]);
      } finally {
        setIsLoadingAuthors(false);
      }
    };
    
    // Clear any existing debounce timer
    if (authorsDebounceTimer.current) {
      clearTimeout(authorsDebounceTimer.current);
    }
    
    // Set a new debounce timer
    authorsDebounceTimer.current = setTimeout(updateAvailableAuthors, 300);
    
    // Clean up the timer on component unmount
    return () => {
      if (authorsDebounceTimer.current) {
        clearTimeout(authorsDebounceTimer.current);
      }
    };
  }, [formData.repository, formData.branches, repositoryValid]);
  
  // Update date range when branches or authors change
  useEffect(() => {
    const updateDateRange = async () => {
      const { repository, branches, authors } = formData;
      
      if (!repository || !repositoryValid || !branches.length) {
        return;
      }
      
      try {
        setIsLoadingDateRange(true);
        const branchNames = branches.map(branch => typeof branch === 'object' ? branch.name : branch);
        
        // Create a cache key based on repository, branches and authors
        const cacheKey = `${repository}:${branchNames.sort().join(',')}:${authors.sort().join(',')}`;
        
        let newDateRange;
        
        // Check if we have cached results
        if (apiCache.current.dateRanges[cacheKey]) {
          newDateRange = apiCache.current.dateRanges[cacheKey];
        } else {
          // Fetch from API if not cached
          newDateRange = await api.getDateRange(repository, branchNames, authors);
          
          // Cache the results
          apiCache.current.dateRanges[cacheKey] = newDateRange;
        }
        
        setDateRange(newDateRange);
        
        // Update date fields if they're outside the new range
        setFormData(prev => {
          const updatedForm = { ...prev };
          
          // If start date is before first commit date, update it
          if (newDateRange.firstCommitDate && (!prev.startDate || new Date(prev.startDate) < new Date(newDateRange.firstCommitDate))) {
            updatedForm.startDate = new Date(newDateRange.firstCommitDate);
          }
          
          // If end date is after last commit date, update it
          if (newDateRange.lastCommitDate && (!prev.endDate || new Date(prev.endDate) > new Date(newDateRange.lastCommitDate))) {
            updatedForm.endDate = new Date(newDateRange.lastCommitDate);
          }
          
          return updatedForm;
        });
      } catch (err) {
        console.error('Error fetching date range:', err);
      } finally {
        setIsLoadingDateRange(false);
      }
    };
    
    // Clear any existing debounce timer
    if (dateRangeDebounceTimer.current) {
      clearTimeout(dateRangeDebounceTimer.current);
    }
    
    // Set a new debounce timer
    dateRangeDebounceTimer.current = setTimeout(updateDateRange, 300);
    
    // Clean up the timer on component unmount
    return () => {
      if (dateRangeDebounceTimer.current) {
        clearTimeout(dateRangeDebounceTimer.current);
      }
    };
  }, [formData.repository, formData.branches, formData.authors, repositoryValid]);

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
      console.error('Error fetching repository details:', err);
      setError(`Error loading repository details: ${err.message || 'Unknown error'}`);
      setRepositoryValid(false);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle branches selection
  const handleBranchesChange = (newBranches) => {
    setFormData(prev => ({ ...prev, branches: newBranches, authors: [] }));
  };

  // Handle authors selection
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