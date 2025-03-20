/**
 * PDF Job Processor
 * 
 * A robust architecture for generating PDFs using Bull queue and Puppeteer
 * - Handles job queuing, processing, and error handling
 * - Provides job status tracking and progress updates
 * - Includes resource cleanup and retry logic
 */
const Bull = require('bull');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const s3Service = require('../S3Service');
const Report = require('../../models/Report');

// Configure Redis connection
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD
  }
};

// Create the PDF generation queue
const pdfQueue = new Bull('pdf-generation', {
  ...redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

/**
 * Generate HTML content for the PDF
 * 
 * @param {Object} options The options for HTML generation
 * @returns {String} The generated HTML content
 */
async function generateHTML(options) {
  const { title, content, repository, startDate, endDate } = options;
  
  // Import HTML generation function from existing service
  // This assumes there's an existing function to generate HTML
  // In a real implementation, this would use a template engine or HTML generator
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title || repository || 'Git Report'}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1, h2, h3 { color: #2c3e50; }
        pre, code {
          background-color: #f5f5f5;
          padding: 5px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title || repository || 'Git Report'}</h1>
        ${content || 'No content provided'}
        <footer>
          <p>Generated on ${new Date().toISOString().split('T')[0]}</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

/**
 * Launch browser with retry logic
 * 
 * @param {Number} attempts Maximum number of attempts
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function launchBrowserWithRetry(attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await puppeteer.launch({
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
    } catch (error) {
      console.error(`Failed to launch browser (attempt ${attempt}/${attempts}):`, error);
      
      if (attempt === attempts) {
        throw new Error(`Failed to launch browser after ${attempts} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Process PDF generation jobs
pdfQueue.process(async (job) => {
  const { reportId, options } = job.data;
  let browser = null;
  let tempDir = null;
  
  try {
    // Update job progress
    await job.progress(10);
    console.log(`Processing PDF for report ${reportId} - Started`);
    
    // Create temp directory for HTML
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitstatus-'));
    const htmlPath = path.join(tempDir, 'report.html');
    
    // Generate HTML content
    const htmlContent = await generateHTML(options);
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
    
    await job.progress(30);
    console.log(`Processing PDF for report ${reportId} - HTML generated`);
    
    // Launch browser with retry logic
    browser = await launchBrowserWithRetry();
    
    await job.progress(50);
    
    // Generate PDF
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
      timeout: 120000
    });
    
    await job.progress(70);
    console.log(`Processing PDF for report ${reportId} - PDF generated`);
    
    // Upload to S3
    const key = `reports/${reportId}/report-${Date.now()}.pdf`;
    const uploadResult = await s3Service.uploadBuffer({
      buffer: pdfBuffer,
      key,
      contentType: 'application/pdf'
    });
    
    await job.progress(90);
    console.log(`Processing PDF for report ${reportId} - Uploaded to S3`);
    
    // Update report with PDF URL
    await Report.findByIdAndUpdate(reportId, { 
      pdfUrl: uploadResult.key,
      pdfStatus: 'completed',
      pdfError: null
    });
    
    await job.progress(100);
    console.log(`Processing PDF for report ${reportId} - Completed`);
    
    // Return success
    return { 
      status: 'completed',
      pdfUrl: uploadResult.key,
      viewUrl: uploadResult.url
    };
  } catch (error) {
    console.error(`Error generating PDF for report ${reportId}:`, error);
    
    // Update report with error
    await Report.findByIdAndUpdate(reportId, { 
      pdfStatus: 'failed',
      pdfError: error.message
    });
    
    // Throw error to trigger job failure
    throw error;
  } finally {
    // Clean up resources
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
    
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error removing temp directory:', error);
      }
    }
  }
});

// Add monitoring and metrics
pdfQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

pdfQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

pdfQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

module.exports = {
  pdfQueue,
  
  /**
   * Add a new PDF generation job to the queue
   * 
   * @param {String} reportId - ID of the report to generate PDF for
   * @param {Object} options - PDF generation options
   * @returns {Promise<Object>} - Job information
   */
  addJob: async (reportId, options) => {
    const job = await pdfQueue.add({ reportId, options });
    
    // Update report status
    await Report.findByIdAndUpdate(reportId, {
      pdfStatus: 'pending',
      pdfError: null
    });
    
    return { id: job.id };
  },
  
  /**
   * Get the status of a PDF generation job
   * 
   * @param {String} jobId - ID of the job
   * @returns {Promise<Object>} - Job status information
   */
  getJobStatus: async (jobId) => {
    const job = await pdfQueue.getJob(jobId);
    if (!job) return { status: 'not-found' };
    
    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      progress: job.progress(),
      data: job.data,
      failedReason: job.failedReason,
      createdAt: job.timestamp
    };
  },
  
  /**
   * Clean up old jobs from the queue
   * 
   * @returns {Promise<void>}
   */
  cleanupOldJobs: async () => {
    await pdfQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await pdfQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  }
}; 