const Report = require('../../models/Report');
const { GitHubCommitService, GitHubBranchService } = require('../../services/GitHub');
const OpenAIService = require('../../services/OpenAIService');
const S3Service = require('../../services/S3Service');
const { ReportUsageTrackerService, CommitUsageTrackerService, TokenUsageTrackerService } = require('../../services/UsageStats');
const User = require('../../models/User');
const { NotFoundError } = require('../../utils/errors');
const ReportService = require('../../services/ReportService');
const PDFService = require('../../services/PDFService');
const QueueService = require('../../services/QueueService');
const CommitSummary = require('../../models/CommitSummary');
/**
 * Generate a report based on selected commit IDs
 */
exports.generateReport = async (req, res) => {
  try {
    const { repository, branches, authors, startDate, endDate, title, includeCode, commitIds } = req.body;
    
    if (!repository || !commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // Get user access token
    const accessToken = req.user.accessToken;
    const userId = req.user.id;
    
    // Track if this is a cached report or newly generated
    let isCachedReport = false;
    
    // Check if user has reached their report limit
    const hasReachedLimit = await ReportUsageTrackerService.hasReachedReportLimit(userId);
    if (hasReachedLimit) {
      return res.status(403).json({ 
        error: 'Report limit reached', 
        message: 'You have reached your monthly report generation limit.',
        upgrade: true
      });
    }
    
    // Set report type
    const reportType = includeCode ? 'detailed' : 'summary';
    
    // Get commits
    console.log(`Fetching ${commitIds.length} commits from GitHub for ${repository}`);
    const commits = await GitHubCommitService.getCommitsByIds({
      accessToken,
      repository,
      commitIds
    });
    
    // Create a hash of the commit IDs for caching
    const commitsHash = Buffer.from(commitIds.sort().join(',')).toString('base64');
    
    // Check if we have a cached report
    const existingReport = await Report.findOne({
      commitsHash,
      user: userId
    }).sort({ createdAt: -1 });
    
    if (existingReport) {
      console.log(`Found existing report (${existingReport.id}) for these commits`);
      isCachedReport = true;
      
      // Update access count and last accessed timestamp
      existingReport.accessCount += 1;
      existingReport.lastAccessed = new Date();
      await existingReport.save();
      
      // If PDF is still processing, use existing info
      if (existingReport.pdfUrl === 'pending') {
        return res.json({
          id: existingReport.id,
          title: existingReport.name,
          repository: existingReport.repository,
          createdAt: existingReport.createdAt,
          pdfUrl: existingReport.pdfUrl,
          pdfJobId: existingReport.pdfJobId,
          pdfStatus: 'pending',
          cached: true
        });
      }
      
      // If PDF is ready, return it
      if (existingReport.pdfUrl && existingReport.pdfUrl !== 'failed') {
        const urls = await ReportService.generateReportUrls(existingReport);
        return res.json({
          id: existingReport.id,
          title: existingReport.name,
          repository: existingReport.repository,
          createdAt: existingReport.createdAt,
          pdfUrl: existingReport.pdfUrl,
          viewUrl: urls.viewUrl,
          downloadUrl: urls.downloadUrl,
          cached: true
        });
      }
    }
    
    // Create a set of unique commits to track
    const uniqueCommits = new Set(commitIds);
    
    // Create initial report in database
    const report = await createReport({
      userId: req.user.id,
      title,
      repository,
      branches,
      authors,
      startDate,
      endDate,
      commits,
      commitsHash
    });
    
    try {
      // First, queue summary generation for all commits that don't have summaries yet
      const commitSummaryJobs = [];
      
      // Keep track of which commits already have summaries
      const commitSummaries = await Promise.all(
        commits.map(async (commit) => {
          // Check if this commit already has a summary in the database
          const existingSummary = await CommitSummary.findOne({
            repository,
            commitId: commit.sha
          });
          
          if (existingSummary) {
            // If summary exists, return it directly
            return {
              sha: existingSummary.commitId,
              message: existingSummary.message,
              author: existingSummary.author,
              date: existingSummary.date,
              summary: existingSummary.summary,
              filesChanged: existingSummary.filesChanged || 0,
              fromCache: true
            };
          } else {
            // Queue this commit for summary generation
            const jobInfo = await OpenAIService.queueCommitSummary(commit, repository, true, report.id);
            
            // Track the job
            commitSummaryJobs.push({
              sha: commit.sha,
              jobId: jobInfo.id
            });
            
            // Return a placeholder
            return {
              sha: commit.sha,
              message: commit.message || 'No message',
              author: commit.author?.name || commit.author?.login || 'Unknown',
              date: commit.date || new Date(),
              summary: commit.message ? commit.message.split('\n')[0].substring(0, 100) : 'No summary available',
              filesChanged: commit.filesChanged || 0,
              fromCache: false,
              pendingJobId: jobInfo.id
            };
          }
        })
      );
      
      // Update report with commitSummaryJobs info
      if (commitSummaryJobs.length > 0) {
        report.pendingCommitJobs = commitSummaryJobs.map(job => ({
          commitId: job.sha,
          jobId: job.jobId
        }));
        report.summaryStatus = 'pending';
      } else {
        // All summaries are already cached, we can queue the report immediately
        report.summaryStatus = 'completed';
      }
      
      await report.save();
      
      // If there are no pending commit jobs, queue the report generation immediately
      if (commitSummaryJobs.length === 0) {
        // Queue report generation
        const reportOptions = {
          repository, 
          commits: commitSummaries, // Use the cached summaries
          title, 
          includeCode, 
          branchInfo: branches?.join(', ') || 'All branches',
          authorInfo: authors?.join(', ') || 'All authors',
          trackTokens: true,
          reportId: report.id,
          userId,          // Add userId to be used in the completion handler
          commitCount: uniqueCommits.size  // Add commitCount for report type calculation
        };
        
        // Add report generation job to queue
        const reportJobInfo = await OpenAIService.generateReportFromCommits(reportOptions, report.id);
        
        // Update report with report job ID
        report.reportJobId = reportJobInfo.id;
        report.reportStatus = 'pending';
        console.log(report)
        await report.save();
      }
      
      return res.json({
        id: report.id,
        title: report.name,
        repository,
        createdAt: report.createdAt,
        pdfUrl: 'pending',
        reportJobId: report.reportJobId || null,
        reportStatus: report.reportStatus || 'pending',
        summaryStatus: report.summaryStatus,
        pendingCommitJobs: commitSummaryJobs.length
      });
      
    } catch (error) {
      await handleReportGenerationError(error, report);
      throw error;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Get commit information for report generation
 */
exports.getCommitInfo = async (req, res) => {
  try {
    const { repository, commitIds } = req.body;

    if (!repository || !commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      return res.status(400).json({ error: 'Repository and commit IDs are required' });
    }

    const accessToken = req.user.accessToken;
    const commits = await GitHubCommitService.getCommitsByIds({
      accessToken,
      repository,
      commitIds
    });

    // Get branch information for each commit
    const commitsWithBranches = await Promise.all(commits.map(async (commit) => {
      try {
        const branches = await GitHubBranchService.getBranchesForCommit({
          accessToken,
          repository,
          commitSha: commit.sha
        });
        
        return {
          ...commit,
          branch: branches.length > 0 ? branches[0] : undefined
        };
      } catch (error) {
        console.error(`Error getting branches for commit ${commit.sha}:`, error);
        return commit;
      }
    }));

    return res.json({ commits: commitsWithBranches });
  } catch (error) {
    console.error('Error getting commit info:', error);
    return res.status(500).json({ error: 'Failed to get commit information' });
  }
};

/**
 * Get PDF generation status
 */
exports.getPdfStatus = async (req, res) => {
  try {
    const report = await ReportService.getReportById(req.params.id, req.user.id);
    
    // If PDF is ready
    if (report.pdfUrl && report.pdfUrl !== 'pending' && report.pdfUrl !== 'failed') {
      const urls = await ReportService.generateReportUrls(report);
      return res.json({
        status: 'completed',
        progress: 100,
        viewUrl: urls.viewUrl,
        downloadUrl: urls.downloadUrl
      });
    }
    
    // If PDF generation failed
    if (report.pdfUrl === 'failed') {
      return res.json({
        status: 'failed',
        error: report.pdfError || 'PDF generation failed'
      });
    }
    
    // If job is in progress
    if (report.pdfJobId) {
      const jobStatus = await QueueService.getPdfJobStatus(report.pdfJobId);
      return res.json({
        status: jobStatus.status,
        progress: jobStatus.progress,
        jobId: jobStatus.id
      });
    }
    
    // Default pending status
    return res.json({
      status: 'pending',
      progress: 0
    });
  } catch (error) {
    console.error('Error getting PDF status:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(500).json({ message: 'Error getting PDF status', error: error.message });
  }
};

/**
 * Get report generation status
 */
exports.getReportStatus = async (req, res) => {
  try {
    const report = await ReportService.getReportById(req.params.id, req.user.id);
    
    // If report content is already available
    if (report.content) {
      return res.json({
        status: 'completed',
        progress: 100,
        reportId: report.id
      });
    }
    
    // If report generation failed
    if (report.reportStatus === 'failed') {
      return res.json({
        status: 'failed',
        error: report.reportError || 'Report generation failed'
      });
    }
    
    // If job is in progress
    if (report.reportJobId) {
      const jobStatus = await OpenAIService.getReportJobStatus(report.reportJobId);
      return res.json({
        status: jobStatus.status,
        progress: jobStatus.progress,
        jobId: jobStatus.id
      });
    }
    
    // Default pending status
    return res.json({
      status: 'pending',
      progress: 0
    });
  } catch (error) {
    console.error('Error getting report generation status:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(500).json({ message: 'Error getting report status', error: error.message });
  }
};

/**
 * Get commit summary status
 */
exports.getCommitSummaryStatus = async (req, res) => {
  try {
    const report = await ReportService.getReportById(req.params.id, req.user.id);
    
    // If all summaries are completed
    if (report.summaryStatus === 'completed') {
      return res.json({
        status: 'completed',
        progress: 100,
        pendingJobs: 0,
        completedJobs: report.commits.length
      });
    }
    
    // If summary generation failed
    if (report.summaryStatus === 'failed') {
      return res.json({
        status: 'failed',
        error: 'Failed to generate commit summaries'
      });
    }
    
    // If jobs are in progress
    if (report.pendingCommitJobs && report.pendingCommitJobs.length > 0) {
      // Count completed jobs
      const completedJobs = report.pendingCommitJobs.filter(job => job.status === 'completed').length;
      const totalJobs = report.pendingCommitJobs.length;
      
      // Calculate progress
      const progress = Math.round((completedJobs / totalJobs) * 100);
      
      return res.json({
        status: 'pending',
        progress,
        pendingJobs: totalJobs - completedJobs,
        completedJobs,
        totalJobs
      });
    }
    
    // Default response if no pending jobs but status isn't completed
    return res.json({
      status: report.summaryStatus || 'pending',
      progress: 0,
      pendingJobs: 0,
      completedJobs: 0
    });
  } catch (error) {
    console.error('Error getting commit summary status:', error);
    if (error instanceof NotFoundError) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(500).json({ message: 'Error getting commit summary status', error: error.message });
  }
};

// Helper functions

async function createReport({ userId, title, repository, branches, authors, startDate, endDate, commits, commitsHash }) {
  // Extract authors from commits
  const authorsFromCommits = commits
    .filter(c => c.author?.name || c.commit?.author?.name)
    .map(c => c.author?.name || c.commit?.author?.name);
  
  const uniqueAuthors = [...new Set(authorsFromCommits)];

  const report = new Report({
    user: userId,
    name: title,
    repository,
    branch: branches?.length > 0 ? branches.join(', ') : 'All branches',
    author: uniqueAuthors.length > 0 ? uniqueAuthors.join(', ') : (authors?.join(', ') || 'All authors'),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    commits: commits.map(commit => ({
      commitId: commit.sha,
      message: commit.commit?.message || commit.message || 'No message',
      author: commit.committer?.login || commit.committer?.name || commit.commit?.committer?.name || 'Unknown',
      date: commit.commit?.author?.date || commit.date || new Date(),
      summary: commit.summary || ''
    })),
    pdfUrl: 'pending',
    commitsHash,
    accessCount: 1,
    lastAccessed: new Date()
  });
  
  await report.save();
  return report;
}

async function handleReportGenerationError(error, report) {
  console.error('Error in PDF generation or S3 upload:', error);
  
  if (report.id) {
    try {
      const existingReport = await Report.findById(report.id);
      if (existingReport) {
        if (existingReport.pdfUrl === 'pending') {
          await Report.findByIdAndDelete(report.id);
        } else {
          const pdfExists = await S3Service.objectExists(existingReport.pdfUrl);
          if (!pdfExists) {
            await Report.findByIdAndDelete(report.id);
          }
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up failed report:', cleanupError);
    }
  }
} 