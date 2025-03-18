import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography, 
  TextField, 
  Button, 
  Grid, 
  CircularProgress, 
  FormControl, 
  Chip, 
  Autocomplete, 
  FormHelperText, 
  Box, 
  Checkbox,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';
import { useModal } from '../../contexts/ModalContext';

const CreateReportModal = () => {
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
  // eslint-disable-next-line no-unused-vars
  const [_repositoryInfo, setRepositoryInfo] = useState(null);
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
  const [loading, setLoading] = useState(false); // eslint-disable-line no-unused-vars
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loadingViewCommits, setLoadingViewCommits] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const authors = await api.getAuthorsForBranches(repository, branchNames);
        setAvailableAuthors(authors);
        
        // Filter out selected authors that are no longer available
        setFormData(prev => ({
          ...prev,
          authors: prev.authors.filter(author => authors.includes(author))
        }));
      } catch (err) {
        console.error('Error fetching authors:', err);
        setAvailableAuthors([]);
      } finally {
        setIsLoadingAuthors(false);
      }
    };
    
    updateAvailableAuthors();
  }, [formData.repository, formData.branches, repositoryValid]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update date range when branches or authors change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const updateDateRange = async () => {
      const { repository, branches, authors } = formData;
      
      if (!repository || !repositoryValid || !branches.length) {
        return;
      }
      
      try {
        setIsLoadingDateRange(true);
        const branchNames = branches.map(branch => typeof branch === 'object' ? branch.name : branch);
        const newDateRange = await api.getDateRange(repository, branchNames, authors);
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
    
    updateDateRange();
  }, [formData.repository, formData.branches, formData.authors, repositoryValid]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Repository validation and loading associated data
  const validateAndLoadRepositoryData = async (repoFullName) => {
    if (!repoFullName || !repoFullName.includes('/')) {
      setRepositoryInfo(null);
      setBranches([]);
      setAvailableAuthors([]);
      setRepositoryValid(false);
      return;
    }

    try {
      setValidating(true);
      setError(null);
      
      const repoInfo = await api.getRepositoryInfo(repoFullName);
      setRepositoryInfo(repoInfo);
      
      // Fetch branches
      const branchesData = await api.getBranches(repoFullName);
      setBranches(branchesData);
      
      // Reset selected branches and authors
      setFormData(prev => ({
        ...prev,
        branches: [],
        authors: []
      }));
      
      setRepositoryValid(true);
    } catch (err) {
      console.error('Repository validation error:', err);
      setRepositoryInfo(null);
      setBranches([]);
      setAvailableAuthors([]);
      setRepositoryValid(false);
      setError(err.response?.data?.message || 'Invalid repository format or repository not found');
    } finally {
      setValidating(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation errors when updating the field
    if (name === 'repository') {
      setError(null);
    }
  };

  // Handle repository selection from autocomplete
  const handleRepositorySelect = (event, newValue) => {
    if (newValue) {
      const repoFullName = typeof newValue === 'string' ? newValue : newValue.fullName;
      
      setFormData(prev => ({ 
        ...prev, 
        repository: repoFullName,
        branches: [],
        authors: []
      }));
      
      // Validate and load data for the selected repository
      validateAndLoadRepositoryData(repoFullName);
      
      // Reset the search query to empty after selection
      setSearchQuery('');
    }
  };

  // Handle repository search input change
  const handleRepositorySearchChange = (event, newValue) => {
    setSearchQuery(newValue);
  };
  
  // Handle when user clicks away from repository field
  const handleRepositoryBlur = (event) => {
    const repoValue = formData.repository.trim();
    if (repoValue && repoValue.includes('/')) {
      validateAndLoadRepositoryData(repoValue);
    }
  };
  
  // Handle branches selection
  const handleBranchesChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      branches: newValue,
      authors: [] // Reset authors when branches change
    }));
  };
  
  // Handle authors selection
  const handleAuthorsChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      authors: newValue
    }));
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Load commits for the selected repository, branches, authors, and date range
  const handleViewCommits = async (e) => {
    e.preventDefault();
    
    if (!formData.repository || !formData.branches.length) {
      setError('Repository and at least one branch are required');
      setFormSubmitted(true);
      return;
    }
    
    try {
      setLoadingViewCommits(true);
      setError(null);
      
      // Get branch names from branch objects if needed
      const branchNames = formData.branches.map(branch => 
        typeof branch === 'object' ? branch.name : branch
      );
      
      // Fetch commits
      const commitsData = await api.getCommitsByFilters({
        repository: formData.repository,
        branches: branchNames,
        authors: formData.authors,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null
      });
      
      // Save form data to context
      updateReportData(formData);
      
      // Open view commits modal with the fetched commits
      openViewCommitsModal(formData, commitsData, commitsData.map(commit => commit.sha));
    } catch (error) {
      console.error('Error loading commits:', error);
      setError('Failed to load commits. Please try again.');
    } finally {
      setLoadingViewCommits(false);
    }
  };

  // Handle closing the modal
  const handleClose = () => {
    // Save current form state to context
    updateReportData(formData);
    closeModals();
  };

  return (
    <Dialog 
      open={createReportOpen} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          px: 3, 
          py: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <Typography variant="h5" component="div">Create Report</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <form onSubmit={handleViewCommits}>
          <Grid container spacing={3}>
            {/* Repository Search */}
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                freeSolo
                options={searchResults}
                getOptionLabel={(option) => {
                  // Handle both string inputs and repository objects
                  return typeof option === 'string' ? option : option.fullName;
                }}
                loading={searching}
                inputValue={searchQuery}
                onInputChange={handleRepositorySearchChange}
                onChange={handleRepositorySelect}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={typeof option === 'string' ? option : option.fullName} {...otherProps}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box 
                          component="img" 
                          src={option.ownerAvatar} 
                          alt={option.owner}
                          sx={{ 
                            width: 30, 
                            height: 30, 
                            borderRadius: '50%', 
                            mr: 2,
                            objectFit: 'cover',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {option.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {option.description || 'No description'}
                          </Typography>
                        </Box>
                        <Chip 
                          label={option.isPrivate ? 'Private' : 'Public'} 
                          size="small" 
                          color={option.isPrivate ? 'secondary' : 'default'} 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Repository"
                    placeholder="Search for a repository (e.g., 'facebook/react')"
                    variant="outlined"
                    required
                    error={!!error}
                    helperText={error || "Search for a repository or enter owner/repo format"}
                    onBlur={handleRepositoryBlur}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searching ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                          {repositoryValid && !searching ? <CheckCircleIcon color="success" /> : null}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Branches Selection */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="branches"
                options={['SELECT_ALL_OPTION', ...branches]}
                getOptionLabel={(option) => {
                  if (option === 'SELECT_ALL_OPTION') return '';
                  return typeof option === 'object' ? option.name : option;
                }}
                value={formData.branches}
                onChange={handleBranchesChange}
                disableCloseOnSelect
                disabled={!repositoryValid || validating}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Branches"
                    placeholder="Select branches"
                    variant="outlined"
                    error={formData.branches.length === 0 && formSubmitted}
                    helperText={
                      formData.branches.length === 0 && formSubmitted
                        ? "At least one branch is required"
                        : "Select one or more branches"
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {validating ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    const { key, ...otherProps } = tagProps;
                    return (
                      <Chip
                        key={key}
                        label={typeof option === 'object' ? option.name : option}
                        size="small"
                        {...otherProps}
                      />
                    );
                  })
                }
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  
                  // Special case for the first option - Select/Deselect All
                  if (option === 'SELECT_ALL_OPTION') {
                    return (
                      <li key="select-all-option" {...otherProps} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Checkbox
                            checked={formData.branches.length === branches.length}
                            indeterminate={
                              formData.branches.length > 0 && 
                              formData.branches.length < branches.length
                            }
                            onChange={(e) => {
                              if (formData.branches.length === branches.length) {
                                // Deselect all
                                handleBranchesChange(null, []);
                              } else {
                                // Select all
                                handleBranchesChange(null, [...branches]);
                              }
                            }}
                          />
                          <Box component="span" sx={{ fontWeight: 'bold' }}>
                            {formData.branches.length === branches.length 
                              ? 'Deselect All' 
                              : 'Select All'
                            }
                          </Box>
                        </Box>
                      </li>
                    );
                  }
                  
                  return (
                    <li key={typeof option === 'object' ? option.name : option} {...otherProps}>
                      <Checkbox
                        checked={
                          formData.branches.some(branch => 
                            (typeof branch === 'object' && typeof option === 'object')
                              ? branch.name === option.name
                              : branch === option
                          )
                        }
                        onChange={() => {}}
                      />
                      {typeof option === 'object' ? option.name : option}
                    </li>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: '250px' }
                }}
              />
            </Grid>

            {/* Authors Selection */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="authors"
                options={['SELECT_ALL_OPTION', ...availableAuthors]}
                value={formData.authors}
                onChange={handleAuthorsChange}
                disableCloseOnSelect
                disabled={!formData.branches.length || isLoadingAuthors}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Authors"
                    placeholder={isLoadingAuthors ? 'Loading authors...' : 'Select authors'}
                    variant="outlined"
                    helperText="Optional: Select specific authors who contributed to the selected branches"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingAuthors ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  
                  // Special case for the first option - Select/Deselect All
                  if (option === 'SELECT_ALL_OPTION') {
                    return (
                      <li key="select-all-option-authors" {...otherProps} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Checkbox
                            checked={formData.authors.length === availableAuthors.length}
                            indeterminate={
                              formData.authors.length > 0 && 
                              formData.authors.length < availableAuthors.length
                            }
                            onChange={(e) => {
                              if (formData.authors.length === availableAuthors.length) {
                                // Deselect all
                                handleAuthorsChange(null, []);
                              } else {
                                // Select all
                                handleAuthorsChange(null, [...availableAuthors]);
                              }
                            }}
                          />
                          <Typography sx={{ fontWeight: 500 }}>
                            {formData.authors.length === availableAuthors.length
                              ? 'Deselect All Authors'
                              : 'Select All Authors'}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }
                  
                  return (
                    <li key={option} {...otherProps}>
                      <Checkbox
                        checked={formData.authors.includes(option)}
                        onChange={() => {}}
                      />
                      {option}
                    </li>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: '250px' }
                }}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  disabled={isLoadingDateRange || !formData.branches.length}
                  minDate={dateRange.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined}
                  maxDate={formData.endDate || (dateRange.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      helperText={isLoadingDateRange ? "Loading date range..." : "Optional: Filter commits from this date"}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingDateRange ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  disabled={isLoadingDateRange || !formData.branches.length}
                  minDate={formData.startDate || (dateRange.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined)}
                  maxDate={dateRange.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      helperText={isLoadingDateRange ? "Loading date range..." : "Optional: Filter commits until this date"}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingDateRange ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* Report Title */}
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Report Title"
                placeholder="Enter a title for your report"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                helperText="Optional: Default will be based on repository name"
              />
            </Grid>

            {/* Include Code Checkbox */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={formData.includeCode}
                    onChange={(e) => setFormData({ ...formData, includeCode: e.target.checked })}
                    name="includeCode"
                    color="primary"
                  />
                  <Typography>Include code snippets in report</Typography>
                </Box>
                <FormHelperText>Checking this will include the actual code changes in the report</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleViewCommits}
          variant="contained"
          color="primary"
          disabled={loading || validating || !repositoryValid || loadingViewCommits}
        >
          {loadingViewCommits ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Loading Commits...
            </>
          ) : (
            'View Commits'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateReportModal; 