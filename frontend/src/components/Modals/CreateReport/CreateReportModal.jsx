import React from 'react';
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
import './CreateReportModalComponent.css';

const CreateReportModalComponentTemplate = ({
  open,
  onClose,
  formData,
  handleInputChange,
  handleRepositorySelect,
  handleBranchesChange,
  handleAuthorsChange,
  handleDateChange,
  handleCheckboxChange,
  handleSubmit,
  validateForm,
  formSubmitted,
  error,
  repositoryValid,
  searching,
  searchQuery,
  setSearchQuery,
  searchResults,
  branches,
  availableAuthors,
  isLoadingAuthors,
  isLoadingDateRange,
  dateRange,
  loadingViewCommits
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="modal-title">
        <Typography variant="h6" className="modal-title-text">
          Create New Report
        </Typography>
        <IconButton 
          onClick={onClose}
          className="close-button"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Repository Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth className="form-field">
              <Autocomplete
                value={formData.repository}
                onChange={(event, newValue) => handleRepositorySelect(newValue)}
                inputValue={searchQuery}
                onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                options={searchResults}
                getOptionLabel={(option) => option}
                filterOptions={(x) => x} // Disable built-in filtering
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Repository"
                    variant="outlined"
                    error={formSubmitted && !repositoryValid}
                    helperText={formSubmitted && !repositoryValid ? "Please select a valid repository" : ""}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searching && (
                            <CircularProgress
                              color="inherit"
                              size={20}
                              className="search-loading-indicator"
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <FormHelperText className="info-text">
                Search for a GitHub repository to analyze
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Branch Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <Autocomplete
                multiple
                value={formData.branches}
                onChange={(event, newValue) => handleBranchesChange(newValue)}
                options={branches}
                getOptionLabel={(option) => typeof option === 'object' ? option.name : option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Branches"
                    variant="outlined"
                    error={formSubmitted && formData.branches.length === 0}
                    helperText={formSubmitted && formData.branches.length === 0 ? "Please select at least one branch" : ""}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={typeof option === 'object' ? option.name : option}
                      {...getTagProps({ index })}
                      className="author-chip"
                    />
                  ))
                }
                disabled={!repositoryValid}
              />
              <FormHelperText className="info-text">
                Select branches to include in the report
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Author Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <Autocomplete
                multiple
                value={formData.authors}
                onChange={(event, newValue) => handleAuthorsChange(newValue)}
                options={availableAuthors}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Authors (optional)"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingAuthors && (
                            <CircularProgress
                              color="inherit"
                              size={20}
                              className="loading-indicator"
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      className="author-chip"
                    />
                  ))
                }
                disabled={!repositoryValid || formData.branches.length === 0 || isLoadingAuthors}
              />
              <FormHelperText className="info-text">
                Filter by specific authors (leave empty to include all)
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(newValue) => handleDateChange('startDate', newValue)}
                  minDate={dateRange?.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined}
                  maxDate={dateRange?.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined}
                  disabled={!repositoryValid || formData.branches.length === 0 || isLoadingDateRange}
                  className="date-picker-container"
                />
              </LocalizationProvider>
              
              {isLoadingDateRange ? (
                <Box className="date-range-indicator">
                  <CircularProgress size={14} className="loading-indicator" />
                  <Typography className="date-range-text">
                    Loading date range...
                  </Typography>
                </Box>
              ) : dateRange?.firstCommitDate ? (
                <FormHelperText className="info-text">
                  First commit: {new Date(dateRange.firstCommitDate).toLocaleDateString()}
                </FormHelperText>
              ) : null}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(newValue) => handleDateChange('endDate', newValue)}
                  minDate={formData.startDate || (dateRange?.firstCommitDate ? new Date(dateRange.firstCommitDate) : undefined)}
                  maxDate={dateRange?.lastCommitDate ? new Date(dateRange.lastCommitDate) : undefined}
                  disabled={!repositoryValid || formData.branches.length === 0 || isLoadingDateRange}
                  className="date-picker-container"
                />
              </LocalizationProvider>
              
              {isLoadingDateRange ? (
                <Box className="date-range-indicator">
                  <CircularProgress size={14} className="loading-indicator" />
                  <Typography className="date-range-text">
                    Loading date range...
                  </Typography>
                </Box>
              ) : dateRange?.lastCommitDate ? (
                <FormHelperText className="info-text">
                  Last commit: {new Date(dateRange.lastCommitDate).toLocaleDateString()}
                </FormHelperText>
              ) : null}
            </FormControl>
          </Grid>

          {/* Report Title */}
          <Grid item xs={12}>
            <FormControl fullWidth className="form-field">
              <TextField
                label="Report Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                variant="outlined"
                error={formSubmitted && !formData.title}
                helperText={formSubmitted && !formData.title ? "Please enter a title for your report" : ""}
              />
              <FormHelperText className="info-text">
                Give your report a descriptive title
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Include Code Option */}
          <Grid item xs={12}>
            <Box className="include-code-option">
              <Checkbox
                checked={formData.includeCode}
                onChange={(e) => handleCheckboxChange('includeCode', e.target.checked)}
                name="includeCode"
                color="primary"
              />
              <Typography>
                Include code snippets in the report
              </Typography>
            </Box>
            <FormHelperText className="info-text">
              When enabled, the report will include relevant code snippets from commits
            </FormHelperText>
          </Grid>

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Typography className="validation-error">
                {error}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          className="submit-button"
          disabled={loadingViewCommits || !validateForm()}
          startIcon={loadingViewCommits ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
        >
          {loadingViewCommits ? 'Loading...' : 'View Commits'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateReportModalComponentTemplate;
