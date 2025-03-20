import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportData } from '../../hooks';
import ViewReportComponentTemplate from './ViewReportComponent.jsx';

/**
 * Page component for viewing a generated report - contains only business logic
 * Data fetching and state management are now handled by useReportData hook
 */
const ViewReportComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report, loading, error, pdfStatus, pdfProgress } = useReportData(id);

  const handleNavigateBack = () => {
    navigate('/dashboard');
  };

  // Pass all required props to the template
  return (
    <ViewReportComponentTemplate
      loading={loading}
      error={error}
      report={report}
      pdfStatus={pdfStatus}
      pdfProgress={pdfProgress}
      handleNavigateBack={handleNavigateBack}
    />
  );
};

export default ViewReportComponent; 