import React from 'react';
import CommitListComponentTemplate from './CommitListComponent.jsx';

/**
 * Component that displays a table of commits included in a report
 */
const CommitListComponent = ({ commits = [] }) => {
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
    <CommitListComponentTemplate 
      commits={commits}
      formatDate={formatDate}
    />
  );
};

export default CommitListComponent; 