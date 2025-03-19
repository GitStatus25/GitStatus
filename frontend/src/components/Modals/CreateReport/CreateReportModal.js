import React from 'react';
import useReportForm from './useReportForm';
import RepositorySelector from './RepositorySelector';
import BranchSelector from './BranchSelector';
import DateRangeSelector from './DateRangeSelector';
import CreateReportModalComponentTemplate from './CreateReportModal.jsx';

/**
 * CreateReportModal component - Modal for selecting repository and parameters for report creation
 * Using custom hooks and specialized selector components for better separation of concerns
 */
const CreateReportModalComponent = () => {
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

  // To maintain compatibility with the JSX template
  return (
    <CreateReportModalComponentTemplate
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
  );
};

export default CreateReportModalComponent;
