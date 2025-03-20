import { useState, useEffect, useCallback } from 'react';
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
  const [pdfStatus, setPdfStatus] = useState('loading');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfPollInterval, setPdfPollInterval] = useState(null);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const fetchedReport = await api.getReportById(reportId);
        
        // Initialize authors set with any existing report authors
        const authors = new Set();
        if (fetchedReport.author) {
          fetchedReport.author.split(', ').forEach(author => authors.add(author));
        }
        
        // Fetch commit details if we have commits
        if (fetchedReport.commits?.length > 0) {
          const commitIds = fetchedReport.commits.map(commit => 
            commit.sha || commit.commitId || commit.id
          ).filter(Boolean);
          
          if (commitIds.length > 0) {
            try {
              // Try to get detailed commit info with author and summary
              const commitDetails = await api.getCommitDetails({
                repository: fetchedReport.repository,
                commitIds
              });
              
              // Merge the commit details with the existing commits
              fetchedReport.commits = fetchedReport.commits.map(commit => {
                const commitId = commit.sha || commit.commitId || commit.id;
                const details = commitDetails.find(c => c.commitId === commitId || c.id === commitId);
                
                // Add author to the set if available
                if (details?.author?.name) {
                  authors.add(details.author.name);
                } else if (details?.author?.login) {
                  authors.add(details.author.login);
                } else if (typeof details?.author === 'string') {
                  authors.add(details.author);
                }
                
                return details ? { ...commit, ...details } : commit;
              });
              
              // Update the report's allAuthors
              fetchedReport.allAuthors = Array.from(authors);
            } catch (error) {
              console.error('Error fetching commit details:', error);
            }
          }
        }
        
        // Handle PDF status
        if (fetchedReport.pdfUrl === 'pending' || fetchedReport.pdfJobId) {
          setPdfStatus('generating');
        } else if (fetchedReport.pdfUrl === 'failed') {
          setPdfStatus('failed');
        } else if (fetchedReport.pdfUrl) {
          setPdfStatus('completed');
        }
        
        setReport(fetchedReport);
        setError(null);
      } catch (error) {
        console.error('Error fetching report:', error);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  // PDF status polling function
  const checkPdfStatus = useCallback(async () => {
    if (!reportId || !report || (report.pdfUrl && report.pdfUrl !== 'pending' && report.pdfUrl !== 'failed')) {
      // If we have a complete PDF URL, no need to poll
      clearInterval(pdfPollInterval);
      setPdfPollInterval(null);
      return;
    }

    try {
      const statusResponse = await api.getPdfStatus(reportId);
      
      setPdfStatus(statusResponse.status);
      if (statusResponse.progress) {
        setPdfProgress(statusResponse.progress);
      }
      
      // If complete or failed, stop polling
      if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
        clearInterval(pdfPollInterval);
        setPdfPollInterval(null);
        
        // If completed, update the report with the new URLs
        if (statusResponse.status === 'completed' && statusResponse.viewUrl && statusResponse.downloadUrl) {
          setReport(prev => ({
            ...prev,
            viewUrl: statusResponse.viewUrl,
            downloadUrl: statusResponse.downloadUrl
          }));
        }
      }
    } catch (error) {
      console.error('Error checking PDF status:', error);
    }
  }, [reportId, report, pdfPollInterval]);

  // Poll for PDF generation status
  useEffect(() => {
    // Start polling when component mounts and we have an ID
    if (reportId && report && !pdfPollInterval && (report.pdfUrl === 'pending' || report.pdfJobId)) {
      // Check immediately
      checkPdfStatus();
      
      // Then set up interval (every 3 seconds)
      const interval = setInterval(checkPdfStatus, 3000);
      setPdfPollInterval(interval);
    }

    // Clean up interval on unmount
    return () => {
      if (pdfPollInterval) {
        clearInterval(pdfPollInterval);
      }
    };
  }, [reportId, report, pdfPollInterval, checkPdfStatus]);

  // Format date helper function
  const formatDate = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }, []);

  return {
    report,
    loading,
    error,
    pdfStatus,
    pdfProgress,
    formatDate
  };
};

export default useReportData; 