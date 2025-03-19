import React from 'react';
import ReportHeaderComponentTemplate from './ReportHeaderComponent.jsx';

/**
 * Header component for the ViewReport page with navigation and actions
 */
const ReportHeaderComponent = ({ report }) => {
  return (
    <ReportHeaderComponentTemplate report={report} />
  );
};

export default ReportHeaderComponent; 