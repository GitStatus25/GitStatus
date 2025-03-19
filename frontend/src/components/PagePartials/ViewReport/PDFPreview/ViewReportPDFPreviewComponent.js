import React, { useEffect, useRef, useState } from 'react';
import ViewReportPDFPreviewComponentTemplate from './ViewReportPDFPreviewComponent.jsx';

/**
 * Component for previewing PDFs with various states (loading, failed, preview)
 */
const ViewReportPDFPreviewComponent = ({ 
  report, 
  pdfStatus = 'loading', 
  pdfProgress = 0 
}) => {
  const iframeRef = useRef(null);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    // Check if PDF preview is available after component mounts
    const checkPdfPreview = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          // If the iframe is empty or throws an error, show fallback
          setTimeout(() => {
            try {
              // Check if iframe content is accessible
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              // If empty or has an error message
              if (!iframeDoc || iframeDoc.body.innerHTML === '' || 
                  iframeDoc.body.innerHTML.includes('error')) {
                setPdfPreviewFailed(true);
              }
            } catch (err) {
              // Cross-origin errors will be caught here
              setPdfPreviewFailed(true);
            }
          }, 3000); // Give it 3 seconds to load
        }
      } catch (e) {
        setPdfPreviewFailed(true);
      }
    };

    if (report?.downloadUrl && pdfStatus !== 'pending' && pdfStatus !== 'failed') {
      checkPdfPreview();
    }
  }, [report, pdfStatus]);

  const handleIframeLoad = (e) => {
    try {
      const iframe = e.target;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || iframeDoc.body.innerHTML === '') {
        setPdfPreviewFailed(true);
      }
    } catch (err) {
      setPdfPreviewFailed(true);
    }
  };

  const handleIframeError = () => {
    setPdfPreviewFailed(true);
  };

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const handlePrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  };

  return (
    <ViewReportPDFPreviewComponentTemplate
      report={report}
      pdfStatus={pdfStatus}
      pdfProgress={pdfProgress}
      pdfPreviewFailed={pdfPreviewFailed}
      iframeRef={iframeRef}
      handleIframeLoad={handleIframeLoad}
      handleIframeError={handleIframeError}
      scale={scale}
      numPages={numPages}
      pageNumber={pageNumber}
      handleDocumentLoadSuccess={handleDocumentLoadSuccess}
      handleZoomIn={handleZoomIn}
      handleZoomOut={handleZoomOut}
      handlePrevPage={handlePrevPage}
      handleNextPage={handleNextPage}
    />
  );
};

export default ViewReportPDFPreviewComponent; 