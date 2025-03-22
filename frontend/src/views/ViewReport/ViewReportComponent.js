import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ViewReportComponentTemplate from './ViewReportComponent.jsx';
import { useReportData } from '../../hooks';

/**
 * ViewReport component - Renders a single report view
 */
const ViewReportComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get report data using custom hook
  const { 
    report,
    loading,
    error,
    pdfStatus,
    pdfProgress,
    summaryStatus,
    summaryProgress,
    reportStatus,
    reportProgress,
    pdfPreviewFailed,
    iframeRef,
    handleIframeLoad,
    handleIframeError,
    formatDate
  } = useReportData(id);

  // Navigate back to dashboard
  const handleNavigateBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);


  return (
    <ViewReportComponentTemplate
      report={report}
      loading={loading}
      error={error}
      onBack={handleNavigateBack}
      pdfStatus={pdfStatus}
      pdfProgress={pdfProgress}
      summaryStatus={summaryStatus}
      summaryProgress={summaryProgress}
      reportStatus={reportStatus}
      reportProgress={reportProgress}
      pdfPreviewFailed={pdfPreviewFailed}
      iframeRef={iframeRef}
      handleIframeLoad={handleIframeLoad}
      handleIframeError={handleIframeError}
      formatDate={formatDate}
    />
  );
};

export default ViewReportComponent; 