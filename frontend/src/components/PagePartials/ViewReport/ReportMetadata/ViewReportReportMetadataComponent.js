import React from 'react';
import ViewReportReportMetadataComponentTemplate from './ViewReportReportMetadataComponent.jsx';

/**
 * Component that displays metadata information for a report
 */
const ViewReportReportMetadataComponent = ({ report }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ViewReportReportMetadataComponentTemplate
      report={report}
      formatDate={formatDate}
    />
  );
};

export default ViewReportReportMetadataComponent; 