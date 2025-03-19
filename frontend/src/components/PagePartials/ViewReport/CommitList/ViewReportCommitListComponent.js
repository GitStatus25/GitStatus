import React from 'react';
import ViewReportCommitListComponentTemplate from './ViewReportCommitListComponent.jsx';

/**
 * Component that displays a table of commits included in a report
 */
const ViewReportCommitListComponent = ({ commits = [] }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ViewReportCommitListComponentTemplate 
      commits={commits}
      formatDate={formatDate}
    />
  );
};

export default ViewReportCommitListComponent; 