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
  FormControl, 
  Box, 
  Checkbox,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import RepositorySelector from './RepositorySelector';
import BranchSelector from './BranchSelector';
import AuthorSelector from './AuthorSelector';
import DateRangeSelector from './DateRangeSelector';
import './CreateReportModal.css';

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
        <Typography variant="h6" component="div" className="modal-title-text">
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
          {/* Repository Selection using RepositorySelector component */}
          <Grid item xs={12}>
            <RepositorySelector
              repository={formData.repository}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searching={searching}
              repositoryValid={repositoryValid}
              formSubmitted={formSubmitted}
              onRepositorySelect={handleRepositorySelect}
              onSearchQueryChange={setSearchQuery}
            />
          </Grid>

          {/* Branch Selection using BranchSelector component */}
          <Grid item xs={12} md={6}>
            <BranchSelector
              branches={branches}
              selectedBranches={formData.branches}
              disabled={!repositoryValid}
              formSubmitted={formSubmitted}
              onBranchesChange={handleBranchesChange}
            />
          </Grid>

          {/* Author Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <AuthorSelector
                authors={availableAuthors}
                selectedAuthors={formData.authors}
                disabled={!repositoryValid || formData.branches.length === 0 || isLoadingAuthors}
                formSubmitted={false} // Authors are optional
                onAuthorsChange={handleAuthorsChange}
              />
            </FormControl>
          </Grid>

          {/* Date Range Selection using DateRangeSelector component */}
          <Grid item xs={12}>
            <DateRangeSelector
              startDate={formData.startDate}
              endDate={formData.endDate}
              dateRange={dateRange}
              disabled={!repositoryValid || formData.branches.length === 0}
              isLoadingDateRange={isLoadingDateRange}
              onDateChange={handleDateChange}
            />
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
              <Typography variant="caption" className="info-text">
                Give your report a descriptive title
              </Typography>
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
            <Typography variant="caption" className="info-text">
              When enabled, the report will include relevant code snippets from commits
            </Typography>
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
