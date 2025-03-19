import React from 'react';
import ReportMetadataComponentTemplate from './ReportMetadataComponent.jsx';

/**
 * Component that displays repository and date metadata for a report
 */
const ReportMetadataComponent = ({ report }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ReportMetadataComponentTemplate
      report={report}
      formatDate={formatDate}
    />
  );
};

export default ReportMetadataComponent; 