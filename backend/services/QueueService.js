/**
 * Queue Service
 * 
 * Handles background job processing using Bull queue
 */
const Bull = require('bull'); 
const S3Service = require('./S3Service');
const Report = require('../models/Report');
const fs = require('fs').promises;
// Will be loaded lazily to avoid circular dependency
let PDFService;

// Create Redis connection configuration
const redisConfig = {
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD
  }
};

// Create Bull queues
const pdfQueue = new Bull('pdf-generation', redisConfig);

// Process PDF generation jobs
pdfQueue.process(async (job) => {
  try {
    console.log(`Processing PDF generation job ${job.id}`);
    const { options, reportId } = job.data;
    
    // Update job progress
    await job.progress(10);
    
    // Lazy load PDFService to avoid circular dependency
    if (!PDFService) {
      PDFService = require('./PDFService');
    }
    
    // Generate PDF
    const pdfBuffer = await PDFService._generatePDF(options);
    
    await job.progress(50);
    
    // Write the PDF buffer to a temporary file
    const tempFilePath = `/tmp/report-${reportId}.pdf`;
    await fs.writeFile(tempFilePath, pdfBuffer);
    
    // Upload PDF to S3
    const uploadResult = await S3Service.uploadFile({
      filePath: tempFilePath,
      key: `reports/${reportId}.pdf`,
      contentType: 'application/pdf'
    });
    
    console.log('S3 upload result:', uploadResult);
    const pdfUrl = uploadResult.key;
    
    console.log(`Setting pdfUrl for report ${reportId} to: "${pdfUrl}"`);
    
    await job.progress(80);
    
    // Update report with PDF URL
    await Report.findByIdAndUpdate(reportId, { pdfUrl });
    
    await job.progress(100);
    
    // Return the PDF URL
    return { pdfUrl };
  } catch (error) {
    console.error('Error processing PDF generation job:', error);
    throw error;
  }
});

// Handle completed jobs
pdfQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// Handle failed jobs
pdfQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
  
  // Update the report to indicate failure
  const { reportId } = job.data;
  if (reportId) {
    Report.findByIdAndUpdate(reportId, { 
      pdfUrl: 'failed',
      pdfError: error.message || 'PDF generation failed'
    }).catch(err => {
      console.error(`Failed to update report ${reportId} status:`, err);
    });
  }
});

// Queue service
const queueService = {
  /**
   * Add a PDF generation job to the queue
   * 
   * @param {Object} options - PDF generation options
   * @param {string} reportId - The report ID to update when complete
   * @returns {Promise<Object>} - Job information with id
   */
  async addPdfGenerationJob(options, reportId) {
    const job = await pdfQueue.add({
      options,
      reportId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 100      // Keep last 100 failed jobs
    });
    
    return {
      id: job.id,
      status: 'pending'
    };
  },
  
  /**
   * Get the status of a PDF generation job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Job status information
   */
  async getPdfJobStatus(jobId) {
    const job = await pdfQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not-found' };
    }
    
    const state = await job.getState();
    const progress = job._progress || 0;
    
    return {
      id: job.id,
      status: state,
      progress,
      data: job.data,
      createdAt: job.timestamp
    };
  },
  
  /**
   * Clean up old jobs
   */
  async cleanupJobs() {
    await pdfQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean completed jobs older than 1 day
    await pdfQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 7 days
  }
};

module.exports = queueService; 