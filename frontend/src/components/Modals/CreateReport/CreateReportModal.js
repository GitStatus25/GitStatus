import React from 'react';
import useReportForm from '../../../hooks/useReportForm.js';
import CreateReportModalComponent from './CreateReportModal.jsx';
import ErrorBoundary from '../../ErrorBoundary';

/**
 * CreateReportModal component - Modal for selecting repository and parameters for report creation
 * Using custom hooks for better separation of concerns
 */
const CreateReportModal = () => {
  const {
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
  } = useReportForm();

  // Function to handle error boundary errors
  const handleErrorBoundaryError = (error, errorInfo) => {
    console.error('CreateReportModal ErrorBoundary caught an error:', error, errorInfo);
    
    // Additional error logging could be added here
    // For example, sending to a monitoring service
  }

  // Reset function for ErrorBoundary - closes the modal if an error occurs
  const handleErrorBoundaryReset = () => {
    handleClose();
  }

  // To maintain compatibility with the JSX template, wrapped with ErrorBoundary
  return (
    <ErrorBoundary 
      errorMessage="There was an error with the report creator" 
      onError={handleErrorBoundaryError}
      onReset={handleErrorBoundaryReset}
      resetButtonText="Close and Try Again"
    >
      <CreateReportModalComponent
        open={open}
        onClose={handleClose}
        formData={formData}
        handleInputChange={handleInputChange}
        handleRepositorySelect={handleRepositorySelect}
        handleBranchesChange={handleBranchesChange}
        handleAuthorsChange={handleAuthorsChange}
        handleDateChange={handleDateChange}
        handleCheckboxChange={handleCheckboxChange}
        handleSubmit={handleSubmit}
        validateForm={validateForm}
        formSubmitted={formSubmitted}
        error={error}
        repositoryValid={repositoryValid}
        searching={searching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        branches={branches}
        availableAuthors={availableAuthors}
        isLoadingAuthors={isLoadingAuthors}
        isLoadingDateRange={isLoadingDateRange}
        dateRange={dateRange}
        loadingViewCommits={loadingViewCommits}
      />
    </ErrorBoundary>
  );
};

export default CreateReportModal;
