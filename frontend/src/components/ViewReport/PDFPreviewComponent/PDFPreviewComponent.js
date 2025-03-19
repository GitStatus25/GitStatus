import React, { useEffect, useRef, useState } from 'react';
import PDFPreviewComponentTemplate from './PDFPreviewComponent.jsx';

/**
 * Component for previewing PDFs with various states (loading, failed, preview)
 */
const PDFPreviewComponent = ({ 
  report, 
  pdfStatus = 'loading', 
  pdfProgress = 0 
}) => {
  const iframeRef = useRef(null);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);

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

  return (
    <PDFPreviewComponentTemplate
      report={report}
      pdfStatus={pdfStatus}
      pdfProgress={pdfProgress}
      pdfPreviewFailed={pdfPreviewFailed}
      iframeRef={iframeRef}
      handleIframeLoad={handleIframeLoad}
      handleIframeError={handleIframeError}
    />
  );
};

export default PDFPreviewComponent; 