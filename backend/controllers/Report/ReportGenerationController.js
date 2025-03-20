const Report = require('../../models/Report');
const { GitHubCommitService, GitHubBranchService } = require('../../services/GitHub');
const OpenAIService = require('../../services/OpenAIService');
const S3Service = require('../../services/S3Service');
const { ReportUsageTrackerService, CommitUsageTrackerService, TokenUsageTrackerService } = require('../../services/UsageStats');
const User = require('../../models/User');
const { NotFoundError } = require('../../utils/errors');

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
        error: 'Monthly report generation limit reached',
        limitReached: true
      });
    }
    
    // Fetch commit details
    const commits = await GitHubCommitService.getCommitsByIds({
      accessToken,
      repository,
      commitIds
    });
    
    if (!commits || commits.length === 0) {
      return res.status(404).json({ error: 'No commits found for the specified IDs' });
    }
    
    // Get user's plan limits
    const user = await User.findById(userId).populate('plan');
    if (!user || !user.plan) {
      return res.status(500).json({ error: 'User plan not found' });
    }
    
    // Get unique commit count
    const uniqueCommits = new Set(commits.map(commit => commit.commitId || commit.sha));
    const uniqueCommitCount = uniqueCommits.size;
    
    // Determine report type based on unique commit count
    const reportType = uniqueCommitCount <= user.plan.limits.commitsPerStandardReport ? 'standard' : 'large';
    
    // Check if commit count exceeds the limit for the report type
    if (reportType === 'large' && uniqueCommitCount > user.plan.limits.commitsPerLargeReport) {
      return res.status(400).json({
        error: `Report exceeds maximum commits allowed for large reports (${user.plan.limits.commitsPerLargeReport} commits)`,
        limit: user.plan.limits.commitsPerLargeReport
      });
    }
    
    // Generate a hash to uniquely identify this set of commits
    const commitsHash = reportService.generateCommitsHash(commits);
    
    // Check if a report with this exact set of commits already exists
    const existingReport = await reportService.findReportByCommitsHash(commitsHash);
    
    if (existingReport) {
      // Update the access stats and return existing report
      await reportService.updateReportAccessStats(existingReport);
      isCachedReport = true;
      return res.json({
        message: 'Existing report found with identical commits',
        reportId: existingReport.id,
        cached: true
      });
    }
    
    // Initialize token tracking
    let inputTokenCount = 0;
    let outputTokenCount = 0;
    let modelName = 'gpt-4';
    
    // Generate report content
    const reportContent = await OpenAIService.generateReportFromCommits({
      repository,
      commits,
      title,
      includeCode: includeCode || false,
      branchInfo: branches?.join(', '),
      authorInfo: authors?.join(', '),
      trackTokens: true
    });
    
    // Extract token usage
    if (reportContent.usage) {
      inputTokenCount = reportContent.usage.promptTokens || 0;
      outputTokenCount = reportContent.usage.completionTokens || 0;
      modelName = reportContent.model || 'gpt-4o-mini';
    }
    
    // Determine content for PDF
    const reportContentText = typeof reportContent === 'string' ? 
      reportContent : 
      (reportContent.content || JSON.stringify(reportContent));
    
    // Create report in database
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
      // Generate PDF in background using our robust processor
      const options = {
        title: report.name,
        content: reportContentText,
        repository: report.repository,
        startDate: report.startDate,
        endDate: report.endDate
      };
      
      // Add job to the queue
      const jobInfo = await pdfJobProcessor.addJob(report.id, options);
      
      // Update report with job ID
      report.pdfJobId = jobInfo.id;
      await report.save();
      
      // Track usage statistics if not cached
      if (!isCachedReport) {
        await trackReportUsage({
          userId,
          reportType,
          uniqueCommitCount: uniqueCommits.size,
          inputTokenCount,
          outputTokenCount,
          modelName
        });
      }
      
      return res.json({
        id: report.id,
        title: report.name,
        repository,
        createdAt: report.createdAt,
        pdfUrl: report.pdfUrl,
        pdfJobId: report.pdfJobId,
        pdfStatus: 'pending'
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
    const report = await reportService.getReportById(req.params.id, req.user.id);
    
    // If PDF is ready
    if (report.pdfUrl && report.pdfUrl !== 'pending' && report.pdfUrl !== 'failed') {
      const urls = await reportService.generateReportUrls(report);
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
      const jobStatus = await pdfJobProcessor.getJobStatus(report.pdfJobId);
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