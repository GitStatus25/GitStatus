/**
 * Queue Service
 * 
 * Handles background job processing using Bull queue
 */
const Bull = require('bull'); 
const S3Service = require('./S3Service');
const Report = require('../models/Report');
const User = require('../models/User');
const fs = require('fs').promises;
// Will be loaded lazily to avoid circular dependency
let PDFService;
let OpenAIService;
let CommitSummary;
let TokenUsageTrackerService;
let ReportUsageTrackerService;
let CommitUsageTrackerService;
let UsageStats;

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
    const { commit, repository, trackTokens, reportId } = job.data;
    console.log(commit )
    
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
    const truncatedDiff = commit.files.map(file => file.diff).join('\n')
    
    await job.progress(30);

    const commitFinal = {
      commitMessage: commit.message,
      commitDiff: truncatedDiff,
      commitSha: commit.sha,
      commitAuthor: commit.author?.name || commit.author?.login || 'Unknown',
      commitDate: commit.date || new Date()
    }
    // Call OpenAI to analyze the commit
    const summary = await OpenAIService.analyzeCommit(commitFinal);
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
    
    console.log(commitSummary)

    await commitSummary.save();
  
    await job.progress(100);
    
    // Return the summary
    return { 
      sha: commit.sha, 
      summary,
      fromCache: false,
      reportId
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
        const pdfJobInfo = await PDFService.generatePDF(pdfOptions, reportId);
        
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
pdfQueue.on('completed', async (job, result) => {
  console.log(`PDF job ${job.id} completed with result:`, result);
  const report = await Report.findById(job.data.reportId);
  if (report) {
    report.pdfStatus = 'completed';
    await report.save();
  }
});

summaryQueue.on('completed', async (job, result) => {
  try {
    console.log(`Summary job ${job.id} completed for commit ${result.sha.substring(0, 7)}`);
    
    // Check if this summary is part of a report
    const { reportId } = job.data;
    
    if (reportId) {
      // Update the report to mark this commit summary as completed
      const report = await Report.findById(reportId);
      
      if (report && report.pendingCommitJobs && report.pendingCommitJobs.length > 0) {
        // Find the job in the pendingCommitJobs array
        const commitJobIndex = report.pendingCommitJobs.findIndex(
          cj => cj.commitId === result.sha
        );
        
        if (commitJobIndex !== -1) {
          // Update the job status
          report.pendingCommitJobs[commitJobIndex].status = 'completed';
          await report.save();
          
          // Check if all commit summaries are now completed
          const allCompleted = report.pendingCommitJobs.every(
            cj => cj.status === 'completed'
          );
          
          if (allCompleted) {
            console.log(`All commit summaries completed for report ${reportId}, queueing report generation`);
            
            // Update report status
            report.summaryStatus = 'completed';
            await report.save();
            
            // Lazy load dependencies
            if (!OpenAIService) {
              OpenAIService = require('./OpenAIService');
            }
            
            // Get all commits with their fresh summaries
            const commitSummaries = await Promise.all(
              report.commits.map(async (commit) => {
                const summary = await CommitSummary.findOne({
                  repository: report.repository,
                  commitId: commit.commitId
                });
                
                return {
                  sha: commit.commitId,
                  message: commit.message,
                  author: commit.author,
                  date: commit.date,
                  summary: summary ? summary.summary : commit.summary,
                  filesChanged: summary ? summary.filesChanged : 0,
                  fromCache: true
                };
              })
            );
            
            // Queue report generation
            const reportOptions = {
              repository: report.repository,
              commits: commitSummaries,
              title: report.name,
              includeCode: false, // Default to false, could be stored in the report if needed
              branchInfo: report.branch,
              authorInfo: report.author,
              trackTokens: true,
              reportId: report.id,
              userId: report.user,               // Add userId from report
              commitCount: commitSummaries.length // Add commit count for report type calculation
            };
            
            // Add report generation job to queue
            const reportJobInfo = await OpenAIService.generateReportFromCommits(reportOptions, report.id);
            
            // Update report with report job ID
            report.reportJobId = reportJobInfo.id;
            report.reportStatus = 'pending';
            await report.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in summary completion handler:', error);
  }
});

reportQueue.on('completed', async (job, result) => {
  console.log(`Report job ${job.id} completed with ${result.content ? result.content.length : 0} characters`);
  
  try {
    // Get userId from job data
    const { userId, reportId } = job.data;
    
    if (!userId) {
      console.error(`Job ${job.id} completed but no userId found in job data`);
      return;
    }
    
    // Ensure User model is loaded
    if (!User) {
      User = require('../models/User');
    }
    
    // Find user and handle potential null case, ensuring the plan is populated
    const user = await User.findById(userId).populate('plan');
    if (!user) {
      console.error(`User not found for ID: ${userId} in job ${job.id}`);
      return;
    }
    
    // Lazy load services if needed
    if (!ReportUsageTrackerService) {
      UsageStats = require('./UsageStats');
      ReportUsageTrackerService = UsageStats.ReportUsageTrackerService;
      TokenUsageTrackerService = UsageStats.TokenUsageTrackerService;
      CommitUsageTrackerService = UsageStats.CommitUsageTrackerService;
    }
    
    // Now safely access user.plan
    const reportType = (job.data.commitCount > user.plan.limits.commitsPerStandardReport) ? 'large' : 'standard';
    const uniqueCommitCount = job.data.commitCount || 0;
    
    // Track report generation
    await ReportUsageTrackerService.trackReportGeneration(userId, reportType);
    
    // Track commit analysis
    await CommitUsageTrackerService.trackCommitAnalysis(userId, uniqueCommitCount);
    
    // Update token usage if available in result
    if (result.usage) {
      // Extract token usage from result
      const { promptTokens, completionTokens, totalTokens } = result.usage;
      const modelName = result.model || 'gpt-4o-mini';
      
      // Token costs - matching what's used in ReportGenerationController
      const tokenCosts = {
        'gpt-4': { input: 0.000002027, output: 0.00001011 },
        'gpt-4-mini': { input: 0.000000156, output: 0.000000606 },
        'gpt-4o': { input: 0.000002027, output: 0.00001011 },
        'gpt-4o-mini': { input: 0.000000156, output: 0.000000606 }
      };
      
      const { input: inputCost, output: outputCost } = tokenCosts[modelName] || tokenCosts['gpt-4o-mini'];
      const estimatedCost = (promptTokens * inputCost) + (completionTokens * outputCost);
      
      // Track token usage
      await TokenUsageTrackerService.trackTokenUsage(
        userId,
        promptTokens,
        completionTokens,
        modelName,
        estimatedCost,
        promptTokens * inputCost,
        completionTokens * outputCost
      );
      
      console.log(`Updated token usage for job ${job.id}: ${totalTokens} tokens (${promptTokens} input, ${completionTokens} output)`);
    }
  } catch (error) {
    console.error(`Error processing report completion for job ${job.id}:`, error);
  }
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
   * @param {string} reportId - Optional report ID to associate with this summary
   * @returns {Promise<Object>} - Job information with id
   */
  async addSummaryGenerationJob(commit, repository, trackTokens = true, reportId = null) {
    const job = await summaryQueue.add({
      commit,
      repository,
      trackTokens,
      reportId
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