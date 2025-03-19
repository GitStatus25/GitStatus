/**
 * PDF Generation Service
 * 
 * Uses Puppeteer to generate PDF files from HTML content
 * which allows for proper rendering of Markdown and better formatting
 */
const puppeteer = require('puppeteer');
const marked = require('marked');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const queueService = require('./queue');

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  sanitize: false
});

/**
 * HTML template for PDF generation
 * @param {object} options - Template options
 * @returns {string} - Complete HTML template
 */
const getHtmlTemplate = (options) => {
  const { content, title, repository, startDate, endDate } = options;
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${title || repository}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: white;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      
      h1 {
        font-size: 24px;
        color: #2c3e50;
        margin-top: 30px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      
      h2 {
        font-size: 20px;
        color: #34495e;
        margin-top: 25px;
      }
      
      h3 {
        font-size: 18px;
        color: #34495e;
      }
      
      p {
        margin-bottom: 16px;
      }
      
      ul, ol {
        margin-bottom: 20px;
        padding-left: 20px;
      }
      
      li {
        margin-bottom: 8px;
      }
      
      code {
        font-family: 'Courier New', Courier, monospace;
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 14px;
      }
      
      pre {
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        margin-bottom: 20px;
      }
      
      pre code {
        padding: 0;
        background-color: transparent;
      }
      
      blockquote {
        border-left: 4px solid #ddd;
        padding-left: 16px;
        margin-left: 0;
        color: #666;
      }
      
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 20px;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background-color: #f5f5f5;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #7f8c8d;
        text-align: center;
      }
      
      .highlight {
        background-color: #ffffcc;
        padding: 0 2px;
      }
      
      .page-break {
        page-break-after: always;
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
    </div>
  </body>
  </html>
  `;
};

/**
 * Generate a PDF file from Markdown content
 * This implementation is used directly by the PDF job queue processor
 * 
 * @param {object} options - PDF generation options
 * @returns {Buffer} - PDF file buffer
 */
const _generatePDF = async (options) => {
  const { title, content, repository, startDate, endDate } = options;
  
  if (!content) {
    throw new Error('No content provided for PDF generation');
  }
  
  // Ensure content is a string
  const contentStr = typeof content === 'string' 
    ? content 
    : (content?.content || JSON.stringify(content, null, 2));
  
  // Convert markdown to HTML
  const htmlContent = marked.parse(contentStr);
  
  // Create full HTML document
  const htmlTemplate = getHtmlTemplate({
    title,
    content: htmlContent,
    repository,
    date: new Date(),
    startDate,
    endDate
  });
  
  // Create a temporary file for the HTML
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitstatus-'));
  const htmlPath = path.join(tempDir, 'report.html');
  
  try {
    // Write HTML to temporary file
    await fs.writeFile(htmlPath, htmlTemplate, 'utf8');
    
    // Launch browser and create PDF
    let browser;
    let resultBuffer = null;
    
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    } catch (browserError) {
      console.error('Error launching puppeteer browser:', browserError);
      throw new Error('Failed to launch browser: ' + browserError.message);
    }
    
    try {
      const page = await browser.newPage();
      
      try {
        await page.goto(`file://${htmlPath}`, { 
          waitUntil: 'networkidle0',
          timeout: 30000
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        throw new Error('Failed to load HTML in browser: ' + navError.message);
      }
      
      // Generate PDF
      try {
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '30px',
            right: '30px',
            bottom: '30px',
            left: '30px'
          },
          displayHeaderFooter: true,
          headerTemplate: '<div></div>', // Empty header
          footerTemplate: '<div style="font-size: 10px; text-align: right; width: 100%; padding-right: 30px; color: #95a5a6;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
          timeout: 60000
        });
        
        // Always create a Buffer from the result (even if it's not a proper Buffer instance)
        if (!pdfBuffer || pdfBuffer.length === 0) {
          console.error('PDF buffer is empty or undefined');
          throw new Error('Generated PDF buffer is empty');
        }
        
        // Create a Buffer from the ArrayBuffer/Uint8Array that Puppeteer returns
        resultBuffer = Buffer.from(pdfBuffer);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error('Failed to generate PDF: ' + pdfError.message);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    
    // Return the buffer after browser is closed
    if (!resultBuffer) {
      throw new Error('PDF generation failed - no buffer was created');
    }
    
    return resultBuffer;
  } finally {
    // Cleanup temporary files
    try {
      await fs.unlink(htmlPath);
      await fs.rmdir(tempDir);
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
};

/**
 * Public interface for PDF generation that returns a job ID
 * and triggers background processing
 * 
 * @param {object} options - PDF generation options
 * @param {string} reportId - Report ID to update when complete
 * @returns {Promise<Object>} - Job information with ID and status
 */
const generatePDF = async (options, reportId) => {
  if (!reportId) {
    throw new Error('Report ID is required for background PDF generation');
  }
  
  // Add job to the queue
  const jobInfo = await queueService.addPdfGenerationJob(options, reportId);
  
  return jobInfo;
};

/**
 * Get the status of a PDF generation job
 * 
 * @param {string} jobId - Job ID to check
 * @returns {Promise<Object>} - Job status information
 */
const getPdfJobStatus = async (jobId) => {
  return await queueService.getPdfJobStatus(jobId);
};

module.exports = {
  generatePDF,
  _generatePDF,
  getPdfJobStatus
};
