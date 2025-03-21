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
      // Queue report generation in background
      const reportOptions = {
        repository, 
        commits, 
        title, 
        includeCode, 
        branchInfo: branches?.join(', ') || 'All branches',
        authorInfo: authors?.join(', ') || 'All authors',
        trackTokens: true,
        reportId: report.id
      };
      
      // Add report generation job to queue
      const reportJobInfo = await OpenAIService.generateReportFromCommits(reportOptions, report.id);
      
      // Update report with report job ID
      report.reportJobId = reportJobInfo.id;
      await report.save();
      
      // Generate PDF in background using our robust processor (this is already queued)
      // Will be triggered after report generation completes with real content
      // For now, we'll set it to pending
      report.pdfStatus = 'pending';
      await report.save();
      
      // Track usage statistics if not cached
      if (!isCachedReport) {
        await trackReportUsage({
          userId,
          reportType,
          uniqueCommitCount: uniqueCommits.size,
          inputTokenCount: 0, // Will be updated when the job completes
          outputTokenCount: 0, // Will be updated when the job completes
          modelName: 'queued'
        });
      }
      
      return res.json({
        id: report.id,
        title: report.name,
        repository,
        createdAt: report.createdAt,
        pdfUrl: 'pending',
        reportJobId: report.reportJobId,
        reportStatus: 'pending'
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
      author: commit.author?.login || commit.author?.name || commit.commit?.author?.name || 'Unknown',
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

async function trackReportUsage({ userId, reportType, uniqueCommitCount, inputTokenCount, outputTokenCount, modelName }) {
  // Track report generation
  await ReportUsageTrackerService.trackReportGeneration(userId, reportType);
  
  // Track commit analysis
  await CommitUsageTrackerService.trackCommitAnalysis(
    userId,
    uniqueCommitCount,
    uniqueCommitCount
  );
  
  // Track token usage
  const tokenCosts = {
    'gpt-4': { input: 0.000002027, output: 0.00001011 },
    'gpt-4-mini': { input: 0.000000156, output: 0.000000606 }
  };
  
  const { input: inputCost, output: outputCost } = tokenCosts[modelName] || tokenCosts['gpt-4-mini'];
  const estimatedCost = (inputTokenCount * inputCost) + (outputTokenCount * outputCost);
  
  await TokenUsageTrackerService.trackTokenUsage(
    userId,
    inputTokenCount,
    outputTokenCount,
    modelName,
    estimatedCost,
    inputTokenCount * inputCost,
    outputTokenCount * outputCost
  );
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