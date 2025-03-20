const Report = require('../models/Report');
const S3Service = require('./S3Service');
const crypto = require('crypto');
const { NotFoundError } = require('../utils/errors');

/**
 * Generate a hash from an array of commit IDs
 * This will be used to identify unique sets of commits
 * 
 * @param {Array} commits - Array of commit objects
 * @returns {string} - SHA-256 hash of sorted commit IDs
 */
const generateCommitsHash = (commits) => {
  // Sort commit IDs to ensure consistent hash regardless of order
  const commitIds = commits
    .map(commit => commit.commitId || commit.sha)
    .sort();
  
  // Generate a SHA-256 hash of the sorted commit IDs
  const hash = crypto.createHash('sha256');
  hash.update(commitIds.join(','));
  return hash.digest('hex');
};

/**
 * Find an existing report with the same commits
 * 
 * @param {string} commitsHash - Hash of commits
 * @returns {Promise<Object|null>} - Existing report or null
 */
const findReportByCommitsHash = async (commitsHash) => {
  try {
    const existingReport = await Report.findOne({ commitsHash });
    return existingReport;
  } catch (error) {
    console.error('Error finding report by hash:', error);
    return null;
  }
};

/**
 * Update access stats for a report
 * 
 * @param {Object} report - Report document
 * @returns {Promise<void>}
 */
const updateReportAccessStats = async (report) => {
  try {
    report.accessCount += 1;
    report.lastAccessed = new Date();
    await report.save();
    console.log(`Updated access stats for report ${report.id}, count: ${report.accessCount}`);
  } catch (error) {
    console.error('Error updating report access stats:', error);
    throw error;
  }
};

/**
 * Get report by ID with validated user
 * 
 * @param {string} reportId - Report ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Report document
 * @throws {NotFoundError} - If report not found
 */
const getReportById = async (reportId, userId) => {
  const report = await Report.findOne({
    _id: reportId,
    user: userId
  });
  
  if (!report) {
    throw new NotFoundError('Report not found');
  }
  
  return report;
};

/**
 * Generate download and view URLs for a report
 * 
 * @param {Object} report - Report document
 * @returns {Promise<Object>} - Object with viewUrl and downloadUrl
 */
const generateReportUrls = async (report) => {
  if (!report) {
    console.error('Report object is null or undefined');
    return { viewUrl: null, downloadUrl: null };
  }

  if (!report.pdfUrl || report.pdfUrl === 'pending' || report.pdfUrl === 'failed') {
    console.log(`Report ${report._id}: PDF URL not available (${report.pdfUrl || 'undefined'})`);
    return { viewUrl: null, downloadUrl: null };
  }

  console.log(`Generating signed URL for report ${report._id} with PDF URL: "${report.pdfUrl}"`);

  try {
    const signedUrl = await S3Service.getSignedUrl({ key: report.pdfUrl });
    const viewUrl = signedUrl;
    const downloadUrl = signedUrl;
    
    return { viewUrl, downloadUrl };
  } catch (error) {
    console.error(`Error generating signed URL for report ${report._id}:`, error.message);
    return { viewUrl: null, downloadUrl: null };
  }
};

/**
 * Format report for client response
 * 
 * @param {Object} report - Report document
 * @param {Object} urls - Object with viewUrl and downloadUrl
 * @returns {Object} - Formatted report
 */
const formatReportResponse = (report, urls = {}) => {
  return {
    id: report.id,
    title: report.name,
    repository: report.repository,
    branch: report.branch,
    author: report.author,
    startDate: report.startDate,
    endDate: report.endDate,
    pdfUrl: report.pdfUrl,
    downloadUrl: urls.downloadUrl || '',
    viewUrl: urls.viewUrl || '',
    createdAt: report.createdAt,
    accessCount: report.accessCount || 1,
    lastAccessed: report.lastAccessed || report.createdAt,
    commits: report.commits || []
  };
};

/**
 * Generate a PDF report for the specified report ID
 * @param {string} reportId - The ID of the report to generate PDF for
 * @returns {Promise<Object>} - Job information
 */
const generatePdfReport = async (reportId) => {
  try {
    // Get the report data
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    // Check if PDF generation is already in progress
    if (report.pdfStatus === 'pending') {
      return { status: 'pending', message: 'PDF generation already in progress' };
    }
    
    // Prepare options for PDF generation
    const options = {
      title: `Git Report: ${report.repository}`,
      content: report.content,
      repository: report.repository,
      startDate: report.dateRange?.startDate,
      endDate: report.dateRange?.endDate
    };
    
    // Add job to the queue
    const job = await pdfJobProcessor.addJob(reportId, options);
    
    return {
      status: 'pending',
      jobId: job.id,
      message: 'PDF generation job added to queue'
    };
  } catch (error) {
    console.error('Error queueing PDF generation:', error);
    
    // Update report with error
    await Report.findByIdAndUpdate(reportId, {
      pdfStatus: 'failed',
      pdfError: error.message
    });
    
    throw error;
  }
};

/**
 * Get the status of a PDF generation job
 * @param {string} reportId - The ID of the report
 * @param {string} jobId - The ID of the job
 * @returns {Promise<Object>} - Job status information
 */
const getPdfStatus = async (reportId, jobId) => {
  try {
    // Get the report data
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    // If we have a completed PDF, return it
    if (report.pdfStatus === 'completed' && report.pdfUrl) {
      return {
        status: 'completed',
        pdfUrl: report.pdfUrl
      };
    }
    
    // If we have a failed PDF, return the error
    if (report.pdfStatus === 'failed') {
      return {
        status: 'failed',
        error: report.pdfError || 'Unknown error'
      };
    }
    
    // If we're still pending and have a job ID, check the job status
    if (jobId) {
      const jobStatus = await pdfJobProcessor.getJobStatus(jobId);
      return {
        ...jobStatus,
        reportId
      };
    }
    
    // Otherwise, just return the current status
    return {
      status: report.pdfStatus || 'unknown',
      reportId
    };
  } catch (error) {
    console.error('Error checking PDF status:', error);
    throw error;
  }
};

module.exports = {
  generateCommitsHash,
  findReportByCommitsHash,
  updateReportAccessStats,
  getReportById,
  generateReportUrls,
  formatReportResponse,
  generatePdfReport,
  getPdfStatus
}; 