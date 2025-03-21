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
let OpenAIService;
let CommitSummary;

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
const summaryQueue = new Bull('summary-generation', redisConfig);
const reportQueue = new Bull('report-generation', redisConfig);

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

// Process summary generation jobs
summaryQueue.process(async (job) => {
  try {
    console.log(`Processing summary generation job ${job.id}`);
    const { commit, repository, trackTokens } = job.data;
    
    // Update job progress
    await job.progress(10);
    
    // Lazy load OpenAIService to avoid circular dependency
    if (!OpenAIService) {
      OpenAIService = require('./OpenAIService');
    }
    if (!CommitSummary) {
      CommitSummary = require('../models/CommitSummary');
    }
    
    // Generate summary
    const maxDiffLength = 15000;
    const truncatedDiff = commit.diff && commit.diff.length > maxDiffLength 
      ? commit.diff.substring(0, maxDiffLength) + '... [truncated]'
      : commit.diff;
    
    await job.progress(30);
    
    // Call OpenAI to analyze the commit
    const summary = await OpenAIService.analyzeCommit({
      commitMessage: commit.message,
      diff: truncatedDiff,
      repository,
      commitSha: commit.sha,
      authorName: commit.author?.name || commit.author?.login || 'Unknown'
    });
    
    await job.progress(70);
    
    // Save to database
    const commitSummary = new CommitSummary({
      commitId: commit.sha,
      repository,
      message: commit.message || 'No message',
      author: commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.date || new Date(),
      summary,
      filesChanged: commit.filesChanged || 0,
      lastAccessed: new Date(),
      createdAt: new Date()
    });
    
    await commitSummary.save();
    
    await job.progress(100);
    
    // Return the summary
    return { 
      sha: commit.sha, 
      summary,
      fromCache: false
    };
  } catch (error) {
    console.error('Error processing summary generation job:', error);
    throw error;
  }
});

// Process report generation jobs
reportQueue.process(async (job) => {
  try {
    console.log(`Processing report generation job ${job.id}`);
    const { repository, commits, title, includeCode, branchInfo, authorInfo, trackTokens, reportId } = job.data;
    
    // Update job progress
    await job.progress(10);
    
    // Lazy load OpenAIService to avoid circular dependency
    if (!OpenAIService) {
      OpenAIService = require('./OpenAIService');
    }
    
    // Generate report
    const reportContent = await OpenAIService._generateReportFromCommits({
      repository, 
      commits, 
      title, 
      includeCode, 
      branchInfo, 
      authorInfo, 
      trackTokens
    });
    
    await job.progress(70);
    
    if (reportId) {
      // Update the report in the database
      const report = await Report.findByIdAndUpdate(reportId, {
        content: reportContent.content,
        reportStatus: 'completed'
      }, { new: true });
      
      // Now that the report is complete, generate the PDF
      if (report) {
        console.log(`Report generation completed, starting PDF generation for report ${reportId}`);
        
        // Lazy load PDFService to avoid circular dependency
        if (!PDFService) {
          PDFService = require('./PDFService');
        }
        
        const pdfOptions = {
          title: report.name,
          content: reportContent.content,
          repository: report.repository,
          startDate: report.startDate,
          endDate: report.endDate
        };
        
        // Add PDF generation job
        const pdfJobInfo = await this.addPdfGenerationJob(pdfOptions, reportId);
        
        // Update report with PDF job ID
        await Report.findByIdAndUpdate(reportId, {
          pdfJobId: pdfJobInfo.id,
          pdfStatus: 'pending'
        });
      }
    }
    
    await job.progress(100);
    
    return reportContent;
  } catch (error) {
    console.error('Error processing report generation job:', error);
    
    // Update the report to indicate failure if reportId exists
    const { reportId } = job.data;
    if (reportId) {
      await Report.findByIdAndUpdate(reportId, { 
        reportStatus: 'failed',
        reportError: error.message || 'Report generation failed'
      });
    }
    
    throw error;
  }
});

// Handle completed jobs
pdfQueue.on('completed', (job, result) => {
  console.log(`PDF job ${job.id} completed with result:`, result);
});

summaryQueue.on('completed', (job, result) => {
  console.log(`Summary job ${job.id} completed for commit ${result.sha.substring(0, 7)}`);
});

reportQueue.on('completed', (job, result) => {
  console.log(`Report job ${job.id} completed with ${result.content ? result.content.length : 0} characters`);
});

// Handle failed jobs
pdfQueue.on('failed', (job, error) => {
  console.error(`PDF job ${job.id} failed with error:`, error);
  
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

summaryQueue.on('failed', (job, error) => {
  console.error(`Summary job ${job.id} failed with error:`, error);
});

reportQueue.on('failed', (job, error) => {
  console.error(`Report job ${job.id} failed with error:`, error);
  
  // Update the report to indicate failure if reportId exists
  const { reportId } = job.data;
  if (reportId) {
    Report.findByIdAndUpdate(reportId, { 
      reportError: error.message || 'Report generation failed'
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
   * Add a commit summary generation job to the queue
   * 
   * @param {Object} commit - The commit object
   * @param {string} repository - Repository name
   * @param {boolean} trackTokens - Whether to track token usage
   * @returns {Promise<Object>} - Job information with id
   */
  async addSummaryGenerationJob(commit, repository, trackTokens = true) {
    const job = await summaryQueue.add({
      commit,
      repository,
      trackTokens
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: 100
    });
    
    return {
      id: job.id,
      status: 'pending'
    };
  },
  
  /**
   * Add a report generation job to the queue
   * 
   * @param {Object} options - Report generation options
   * @param {string} options.repository - Repository name
   * @param {Array} options.commits - List of commits
   * @param {string} options.title - Report title
   * @param {boolean} options.includeCode - Whether to include code snippets
   * @param {string} options.reportId - Optional report ID to update when complete
   * @returns {Promise<Object>} - Job information with id
   */
  async addReportGenerationJob(options) {
    const job = await reportQueue.add(options, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000
      },
      removeOnComplete: 100,
      removeOnFail: 100
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
   * Get the status of a summary generation job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Job status information
   */
  async getSummaryJobStatus(jobId) {
    const job = await summaryQueue.getJob(jobId);
    
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
   * Get the status of a report generation job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Job status information
   */
  async getReportJobStatus(jobId) {
    const job = await reportQueue.getJob(jobId);
    
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
    await summaryQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await summaryQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    await reportQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await reportQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
  }
};

module.exports = queueService; 