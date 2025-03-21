import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * Custom hook for fetching and managing report data
 * Separates data fetching and state management from presentation
 */
export const useReportData = (reportId) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // PDF generation status state
  const [pdfStatus, setPdfStatus] = useState('pending');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [summaryStatus, setSummaryStatus] = useState('pending');
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [reportStatus, setReportStatus] = useState('pending');
  const [reportProgress, setReportProgress] = useState(0);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);
  
  // Refs for the polling intervals
  const pdfPollInterval = useRef(null);
  const summaryPollInterval = useRef(null);
  const reportPollInterval = useRef(null);
  
  // Don't store AbortController in a ref that persists across renders
  // Instead, create a new one for each operation
  
  const iframeRef = useRef(null);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (pdfPollInterval.current) clearInterval(pdfPollInterval.current);
      if (summaryPollInterval.current) clearInterval(summaryPollInterval.current);
      if (reportPollInterval.current) clearInterval(reportPollInterval.current);
    };
  }, []);

  // Fetch report data
  useEffect(() => {
    // Create a new AbortController for this specific effect run
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchReport = async () => {
      if (!reportId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the signal created in this effect
        const reportData = await api.getReportById(reportId, signal);

        // Don't update state if the component unmounted
        if (signal.aborted) return;
        
        setReport(reportData);

        // Initialize status states based on report data
        if (reportData.summaryStatus) {
          setSummaryStatus(reportData.summaryStatus);
        }
        
        if (reportData.reportStatus) {
          setReportStatus(reportData.reportStatus);
        }
        
        if (reportData.pdfUrl && reportData.pdfUrl !== 'pending' && reportData.pdfUrl !== 'failed') {
          setPdfStatus('completed');
          setPdfProgress(100);
        } else if (reportData.pdfUrl === 'failed') {
          setPdfStatus('failed');
        } else {
          setPdfStatus('pending');
        }

        // Start polling for summary status if pending
        if (reportData.summaryStatus !== 'completed' && reportData.summaryStatus !== 'failed') {
          startSummaryPolling(reportId);
        }

        // Start polling for report status if pending and summary is completed
        if (reportData.reportStatus !== 'completed' && reportData.reportStatus !== 'failed' && 
            reportData.summaryStatus === 'completed') {
          startReportPolling(reportId);
        }

        // Start polling for PDF status if pending and report is completed
        if ((reportData.pdfUrl === 'pending' || !reportData.pdfUrl) && reportData.reportStatus === 'completed') {
          startPdfPolling(reportId);
        }
      } catch (error) {
        // Don't update state if the component unmounted or request was canceled
        if (signal.aborted || error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('Request was aborted or canceled');
          return;
        }
        
        console.error('Error fetching report:', error);
        setError(error.message || 'Failed to load report');
      } finally {
        // Don't update state if the component unmounted
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    // Cleanup function for this effect only
    return () => {
      controller.abort();
    };
  }, [reportId]);

  // Function to start polling for commit summary status
  const startSummaryPolling = (reportId) => {
    if (summaryPollInterval.current) {
      clearInterval(summaryPollInterval.current);
    }

    // Function to check summary status
    const checkSummaryStatus = async () => {
      // Create a new controller for each polling request
      const controller = new AbortController();
      
      try {
        const statusResponse = await api.getCommitSummaryStatus(reportId, controller.signal);
        
        setSummaryStatus(statusResponse.status);
        if (statusResponse.progress) {
          setSummaryProgress(statusResponse.progress);
        }
        
        // If complete or failed, stop polling
        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          clearInterval(summaryPollInterval.current);
          summaryPollInterval.current = null;
          
          // If completed, start report polling
          if (statusResponse.status === 'completed') {
            setReport(prev => ({
              ...prev,
              summaryStatus: 'completed'
            }));
            startReportPolling(reportId);
          }
        }
      } catch (error) {
        // Only log errors that aren't from aborted requests
        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
          console.error('Error checking commit summary status:', error);
        }
      }
    };
    
    // Poll immediately
    checkSummaryStatus();
    
    // Start polling every 3 seconds
    summaryPollInterval.current = setInterval(checkSummaryStatus, 3000);
  };

  // Function to start polling for report generation status
  const startReportPolling = (reportId) => {
    if (reportPollInterval.current) {
      clearInterval(reportPollInterval.current);
    }

    // Function to check report status
    const checkReportStatus = async () => {
      // Create a new controller for each polling request
      const controller = new AbortController();
      
      try {
        const statusResponse = await api.getReportStatus(reportId, controller.signal);
        
        setReportStatus(statusResponse.status);
        if (statusResponse.progress) {
          setReportProgress(statusResponse.progress);
        }
        
        // If complete or failed, stop polling
        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          clearInterval(reportPollInterval.current);
          reportPollInterval.current = null;
          
          // If completed, update report content and start PDF polling
          if (statusResponse.status === 'completed') {
            // Create a new controller for this request
            const refreshController = new AbortController();
            
            try {
              // Refresh the report to get the content
              const updatedReport = await api.getReportById(reportId, refreshController.signal);
              setReport(updatedReport);
              setReportStatus('completed');
              
              // Start PDF polling if needed
              if (!updatedReport.pdfUrl || updatedReport.pdfUrl === 'pending') {
                startPdfPolling(reportId);
              }
            } catch (refreshError) {
              // Only log errors that aren't from aborted requests
              if (refreshError.name !== 'AbortError' && refreshError.name !== 'CanceledError') {
                console.error('Error refreshing report:', refreshError);
              }
            }
          }
        }
      } catch (error) {
        // Only log errors that aren't from aborted requests
        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
          console.error('Error checking report status:', error);
        }
      }
    };
    
    // Poll immediately
    checkReportStatus();
    
    // Start polling every 3 seconds
    reportPollInterval.current = setInterval(checkReportStatus, 3000);
  };

  // Function to start polling for PDF status
  const startPdfPolling = (reportId) => {
    if (pdfPollInterval.current) {
      clearInterval(pdfPollInterval.current);
    }

    // Function to check PDF status
    const checkPdfStatus = async () => {
      // Create a new controller for each polling request
      const controller = new AbortController();
      
      try {
        const statusResponse = await api.getPdfStatus(reportId, controller.signal);
        
        setPdfStatus(statusResponse.status);
        if (statusResponse.progress) {
          setPdfProgress(statusResponse.progress);
        }
        
        // If complete or failed, stop polling
        if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
          clearInterval(pdfPollInterval.current);
          pdfPollInterval.current = null;
          
          // If completed, update the report with the new URLs
          if (statusResponse.status === 'completed' && statusResponse.viewUrl && statusResponse.downloadUrl) {
            setReport(prev => ({
              ...prev,
              pdfUrl: statusResponse.pdfUrl || prev.pdfUrl,
              viewUrl: statusResponse.viewUrl,
              downloadUrl: statusResponse.downloadUrl
            }));
          }
        }
      } catch (error) {
        // Only log errors that aren't from aborted requests
        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
          console.error('Error checking PDF status:', error);
        }
      }
    };
    
    // Poll immediately
    checkPdfStatus();
    
    // Start polling every 3 seconds
    pdfPollInterval.current = setInterval(checkPdfStatus, 3000);
  };

  // Handle iframe loading success
  const handleIframeLoad = () => {
    setPdfPreviewFailed(false);
  };

  // Handle iframe loading error
  const handleIframeError = () => {
    setPdfPreviewFailed(true);
  };

  return {
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
    formatDate: (dateString) => {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      return date.toLocaleString();
    }
  };
};

export default useReportData; 