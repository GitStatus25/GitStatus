const Report = require('../models/Report');
const s3Service = require('./s3');
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
  if (!report.pdfUrl || report.pdfUrl === 'pending' || report.pdfUrl === 'failed') {
    return { viewUrl: null, downloadUrl: null };
  }

  const [viewUrl, downloadUrl] = await Promise.all([
    s3Service.getSignedUrl(report.pdfUrl),
    s3Service.getDownloadUrl(
      report.pdfUrl,
      `${report.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.pdf`
    )
  ]);
  
  return { viewUrl, downloadUrl };
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

module.exports = {
  generateCommitsHash,
  findReportByCommitsHash,
  updateReportAccessStats,
  getReportById,
  generateReportUrls,
  formatReportResponse
}; 