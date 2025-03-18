const Report = require('../models/Report');
const githubService = require('../services/github');
const openaiService = require('../services/openai');
const pdfService = require('../services/pdf');
const s3Service = require('../services/s3');
const crypto = require('crypto');
const UsageStatsService = require('../services/usageStats');

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
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // For each report, generate download URLs
    const reportsWithUrls = await Promise.all(
      reports.map(async (report) => {
        let downloadUrl = '';
        
        if (report.pdfUrl && report.pdfUrl !== 'pending') {
          try {
            // Generate a pre-signed URL for downloading the PDF
            downloadUrl = await s3Service.getDownloadUrl(
              report.pdfUrl,
              `${report.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.pdf`
            );
          } catch (error) {
            console.error(`Error getting download URL for report ${report.id}:`, error);
          }
        }
        
        return {
          id: report.id,
          title: report.name,
          repository: report.repository,
          branch: report.branch,
          author: report.author,
          startDate: report.startDate,
          endDate: report.endDate,
          pdfUrl: report.pdfUrl,
          downloadUrl,
          createdAt: report.createdAt,
          accessCount: report.accessCount || 1,
          lastAccessed: report.lastAccessed || report.createdAt
        };
      })
    );
    
    res.json(reportsWithUrls);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Generate a report based on selected commit IDs
exports.generateReport = async (req, res) => {
  try {
    const { repository, branches, authors, startDate, endDate, title, includeCode, commitIds } = req.body;
    
    if (!repository || !commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    console.log(`Generating report for ${repository} with ${commitIds.length} commits`);
    
    // Get user access token
    const accessToken = req.user.accessToken;
    const userId = req.user.id;
    
    // Track if this is a cached report or newly generated
    let isCachedReport = false;
    
    // Check if user has reached their report limit
    const hasReachedLimit = await UsageStatsService.hasReachedReportLimit(userId);
    if (hasReachedLimit) {
      return res.status(403).json({ 
        error: 'Monthly report generation limit reached',
        limitReached: true
      });
    }
    
    // Fetch commit details
    const commits = await githubService.getCommitsByIds({
      accessToken,
      repository,
      commitIds
    });
    
    if (!commits || commits.length === 0) {
      return res.status(404).json({ error: 'No commits found for the specified IDs' });
    }
    
    // Determine report type based on commit count
    const reportType = commits.length <= 5 ? 'standard' : 'big';
    
    // Generate a hash to uniquely identify this set of commits
    const commitsHash = generateCommitsHash(commits);
    
    // Check if a report with this exact set of commits already exists
    const existingReport = await findReportByCommitsHash(commitsHash);
    
    if (existingReport) {
      console.log(`Found existing report with the same commits (${existingReport.id}), reusing it`);
      
      // Update the access stats
      await updateReportAccessStats(existingReport);
      
      // Track report reuse
      isCachedReport = true;
      
      // Return the existing report
      return res.json({
        message: 'Existing report found with identical commits',
        reportId: existingReport.id,
        cached: true
      });
    }
    
    // No existing report, so generate a new one
    console.log('No existing report found, generating new one');
    
    // Initialize token tracking
    let inputTokenCount = 0;
    let outputTokenCount = 0;
    let modelName = 'gpt-4';
    
    // Proceed with normal report generation
    const reportContent = await openaiService.generateReportFromCommits({
      repository,
      commits,
      title,
      includeCode: includeCode || false,
      branchInfo: branches.join(', '),
      authorInfo: authors.join(', '),
      trackTokens: true  // Enable token tracking
    });
    
    // Extract token usage if provided
    if (reportContent.usage) {
      inputTokenCount = reportContent.usage.prompt_tokens || 0;
      outputTokenCount = reportContent.usage.completion_tokens || 0;
      modelName = reportContent.model || 'gpt-4';
      
      console.log('Token usage tracked:', {
        model: modelName,
        inputTokens: inputTokenCount,
        outputTokens: outputTokenCount,
        totalTokens: inputTokenCount + outputTokenCount
      });
    } else {
      // If no token tracking, estimate based on text length (rough estimate)
      const text = typeof reportContent === 'string' ? reportContent : JSON.stringify(reportContent);
      // Roughly estimate 4 chars per token for input (prompt) and output (completion)
      inputTokenCount = Math.ceil(JSON.stringify(commits).length / 4);
      outputTokenCount = Math.ceil(text.length / 4);
    }
    
    // Determine the content to use for the PDF
    const reportContentText = typeof reportContent === 'string' ? 
      reportContent : 
      (reportContent.content || JSON.stringify(reportContent));
    
    // Estimate cost based on token usage (these are example rates, adjust as needed)
    const tokenCosts = {
      'gpt-4o': {
        input: 0.000002027,  // $0.027 per 13,320 tokens
        output: 0.00001011   // $0.044 per 4,352 tokens
      },
      'gpt-4o-mini': {
        input: 0.000000156,  // $0.004 per 25,615 tokens
        output: 0.000000606  // $0.006 per 9,895 tokens
      }
    };
    
    const defaultCost = { input: 0.000000156, output: 0.000000606 }; // Default to 4o-mini rates
    const { input: inputCost, output: outputCost } = tokenCosts[modelName] || defaultCost;
    
    const estimatedCost = (inputTokenCount * inputCost) + (outputTokenCount * outputCost);
    
    console.log('Estimated cost:', {
      model: modelName,
      inputCost: inputTokenCount * inputCost,
      outputCost: outputTokenCount * outputCost,
      totalCost: estimatedCost
    });
    
    // Use provided branches from the request if available, otherwise detect them
    let selectedBranches = [];
    
    if (branches && branches.length > 0) {
      console.log('Using branches provided in the request:', branches);
      selectedBranches = branches;
    } else {
      // Extract branch information from the commits if no branches were provided
      const branchPromises = commits.map(async (commit) => {
        try {
          const branches = await githubService.getBranchesForCommit({
            accessToken,
            repository,
            commitSha: commit.sha
          });
          return { commit, branches };
        } catch (error) {
          console.error(`Error getting branches for commit ${commit.sha}:`, error);
          return { commit, branches: [] };
        }
      });
      
      const branchResults = await Promise.all(branchPromises);
      
      // Log the results to debug
      console.log('Branch detection results:', branchResults.map(result => ({
        commit: result.commit.sha.substring(0, 7),
        branches: result.branches,
        message: result.commit.commit?.message?.split('\n')[0]?.substring(0, 50) || 'No message'
      })));
      
      // Advanced branch detection logic
      const getBestBranches = (branchResults) => {
        // Count which commits belong to which branches
        const branchCounts = {};
        
        branchResults.forEach(result => {
          result.branches.forEach(branch => {
            if (!branchCounts[branch]) {
              branchCounts[branch] = { 
                count: 0, 
                commits: [] 
              };
            }
            branchCounts[branch].count++;
            branchCounts[branch].commits.push(result.commit.sha);
          });
        });
        
        // Identify commits that appear in many branches
        // These are likely older commits that have been merged into multiple branches
        const commitBranchCounts = {};
        branchResults.forEach(result => {
          commitBranchCounts[result.commit.sha] = result.branches.length;
        });
        
        // If a commit appears in many branches, it's likely an older commit
        // We should give less weight to branches that only contain such commits
        const adjustedBranchScores = {};
        
        Object.entries(branchCounts).forEach(([branch, data]) => {
          // Calculate what percentage of the total commits this branch contains
          const percentageOfTotalCommits = data.count / commits.length;
          
          // Calculate the average number of branches per commit in this branch
          const commitsInThisBranch = data.commits;
          const avgBranchesPerCommit = commitsInThisBranch.reduce((sum, commitSha) => {
            return sum + commitBranchCounts[commitSha];
          }, 0) / commitsInThisBranch.length;
          
          // Penalize branches that contain commits present in many other branches
          // This helps prioritize more specific branches
          const exclusivityScore = 1 / (avgBranchesPerCommit || 1);
          
          // Final score prioritizes branches that contain more commits
          // but with a penalty for branches containing very common commits
          adjustedBranchScores[branch] = percentageOfTotalCommits * exclusivityScore;
        });
        
        // Sort branches by adjusted score and take the top 2
        const sortedBranches = Object.entries(adjustedBranchScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(entry => entry[0]);
        
        console.log('Branch scores:', adjustedBranchScores);
        console.log('Selected branches:', sortedBranches);
        
        return sortedBranches;
      };
      
      // Get the best branches based on our advanced logic
      selectedBranches = getBestBranches(branchResults);
      
      // If no branches were found but we have commits, add a fallback branch name
      if (selectedBranches.length === 0 && commits.length > 0) {
        selectedBranches.push('default');
      }
    }
    
    // Extract authors
    const authorsFromCommits = commits
      .filter(c => c.author?.name || c.commit?.author?.name)
      .map(c => c.author?.name || c.commit?.author?.name);
    
    // Remove duplicates
    const uniqueAuthors = [...new Set(authorsFromCommits)];
    
    // Create report in database 
    const report = new Report({
      user: req.user.id,
      name: title,
      repository,
      branch: selectedBranches.length > 0 ? selectedBranches.join(', ') : 'All branches',
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
      pdfUrl: 'pending', // Will be updated after PDF generation
      commitsHash: commitsHash, // Save the commits hash for future lookups
      accessCount: 1,
      lastAccessed: new Date()
    });
    
    try {
      // Create report in database
      await report.save();
      
      // Generate PDF if requested
      console.log('Calling PDF service to generate PDF...');
      const pdfBuffer = await pdfService.generatePDF({
        title: report.name,
        content: reportContentText,
        repository: report.repository,
        startDate: report.startDate,
        endDate: report.endDate
      });
      
      console.log('PDF Buffer received in controller:', {
        bufferExists: !!pdfBuffer,
        isBuffer: Buffer.isBuffer(pdfBuffer),
        bufferLength: pdfBuffer ? pdfBuffer.length : 0,
        bufferType: pdfBuffer ? pdfBuffer.constructor.name : 'None'
      });
      
      // Verify PDF buffer
      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        console.error('PDF verification failed in controller');
        throw new Error('PDF generation failed - empty buffer received');
      }
      
      // Upload PDF to S3
      const pdfUrl = await s3Service.uploadFile({
        fileName: `report-${report.id}.pdf`,
        fileContent: pdfBuffer,
        contentType: 'application/pdf'
      }).then(res => res.key);
      
      // Verify PDF URL
      if (!pdfUrl) {
        throw new Error('S3 upload failed - no URL returned');
      }
      
      // Update report with PDF URL 
      report.pdfUrl = pdfUrl;
      await report.save();
      
      // Track report generation with UsageStatsService
      if (!isCachedReport) {
        // Track report generation
        await UsageStatsService.trackReportGeneration(
          userId, 
          reportType // 'standard' or 'big'
        );
        
        // Track commit analysis
        await UsageStatsService.trackCommitAnalysis(
          userId,
          commits.length, // Total commits analyzed
          commits.length  // All commits were summarized
        );
        
        // Track token usage and cost
        await UsageStatsService.trackTokenUsage(
          userId,
          inputTokenCount,                   // Input tokens
          outputTokenCount,                  // Output tokens
          modelName,                         // Model name
          estimatedCost,                     // Total cost
          inputTokenCount * inputCost,       // Input cost
          outputTokenCount * outputCost      // Output cost
        );
      }
      
      // Return the report
      return res.json({
        id: report.id,
        title: report.name,
        repository,
        createdAt: report.createdAt,
        pdfUrl: report.pdfUrl
      });
    } catch (innerError) {
      console.error('Error in PDF generation or S3 upload:', innerError);
      
      // If we have a report ID, either update it or delete it
      if (report.id) {
        try {
          // Check if the report exists
          const existingReport = await Report.findById(report.id);
          if (existingReport) {
            if (existingReport.pdfUrl === 'pending') {
              // Failed before S3 upload - delete the report
              await Report.findByIdAndDelete(report.id);
              console.log(`Deleted incomplete report ${report.id} due to error`);
            } else {
              // Check if the PDF actually exists in S3
              const pdfExists = await s3Service.objectExists(existingReport.pdfUrl);
              if (!pdfExists) {
                await Report.findByIdAndDelete(report.id);
                console.log(`Deleted report ${report.id} with missing S3 file`);
              }
            }
          }
        } catch (cleanupError) {
          console.error('Error cleaning up failed report:', cleanupError);
        }
      }
      
      throw innerError; // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Generate a report based on selected commit IDs
exports.getCommitInfo = async (req, res) => {
  try {
    const { repository, commitIds } = req.body;

    if (!repository || !commitIds || !Array.isArray(commitIds) || commitIds.length === 0) {
      return res.status(400).json({ error: 'Repository and commit IDs are required' });
    }

    const accessToken = req.user.accessToken;
    const commits = await githubService.getCommitsByIds({
      accessToken,
      repository,
      commitIds
    });

    // Extract branch information
    // We need to make separate API calls to get branch information for each commit
    const commitsWithBranches = await Promise.all(commits.map(async (commit) => {
      try {
        const branches = await githubService.getBranchesForCommit({
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

// Clean up invalid reports that reference missing S3 files
exports.cleanupInvalidReports = async (req, res) => {
  try {
    // Check if user is an admin (optional)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    // }

    const Report = require('../models/Report');
    
    // Get all reports for the current user
    const reports = await Report.find({ user: req.user.id });
    
    if (!reports || reports.length === 0) {
      return res.json({ message: 'No reports found to clean up', cleaned: 0 });
    }
    
    // Track cleanup statistics
    const stats = {
      checked: 0,
      pending: 0,
      invalid: 0,
      valid: 0,
      deleted: 0,
      errors: 0
    };
    
    // Check each report
    for (const report of reports) {
      stats.checked++;
      
      try {
        if (report.pdfUrl === 'pending') {
          // Report with pending status that was never completed
          stats.pending++;
          await Report.findByIdAndDelete(report.id);
          stats.deleted++;
          console.log(`Deleted pending report ${report.id}`);
        } else {
          // Check if the PDF file exists in S3
          const exists = await s3Service.objectExists(report.pdfUrl);
          
          if (!exists) {
            stats.invalid++;
            await Report.findByIdAndDelete(report.id);
            stats.deleted++;
            console.log(`Deleted report ${report.id} with missing S3 file: ${report.pdfUrl}`);
          } else {
            stats.valid++;
          }
        }
      } catch (error) {
        console.error(`Error checking report ${report.id}:`, error);
        stats.errors++;
      }
    }
    
    res.json({
      message: 'Cleanup completed successfully',
      stats
    });
  } catch (error) {
    console.error('Error cleaning up reports:', error);
    res.status(500).json({ error: `Failed to clean up reports: ${error.message}` });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update access stats
    await updateReportAccessStats(report);
    
    // Generate pre-signed URLs for both viewing and downloading
    const [viewUrl, downloadUrl] = await Promise.all([
      s3Service.getSignedUrl(report.pdfUrl),
      s3Service.getDownloadUrl(report.pdfUrl, `${report.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.pdf`)
    ]);
    
    // Return the report object directly with URLs added
    res.json({
      id: report.id,
      name: report.name,
      repository: report.repository,
      branch: report.branch,
      author: report.author,
      startDate: report.startDate,
      endDate: report.endDate,
      commits: report.commits || [],
      pdfUrl: report.pdfUrl,
      createdAt: report.createdAt,
      accessCount: report.accessCount,
      lastAccessed: report.lastAccessed,
      viewUrl,
      downloadUrl
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

/**
 * Get report cache statistics
 */
exports.getCacheStats = async (req, res) => {
  try {
    // Get stats for all reports
    const allReportsCount = await Report.countDocuments({});
    
    // Get total cached accesses (sum of all access counts minus the count of reports)
    const reports = await Report.find({}, 'accessCount');
    const totalAccesses = reports.reduce((sum, report) => sum + (report.accessCount || 1), 0);
    const cachedAccesses = totalAccesses - allReportsCount;
    
    // Calculate cache hit rate
    const cacheHitRate = totalAccesses > 0 ? (cachedAccesses / totalAccesses) * 100 : 0;
    
    // Get most accessed reports
    const popularReports = await Report.find({})
      .sort({ accessCount: -1 })
      .limit(5)
      .select('name repository accessCount lastAccessed');
    
    // Get most recently accessed reports
    const recentlyAccessedReports = await Report.find({})
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('name repository accessCount lastAccessed');
    
    res.json({
      totalReports: allReportsCount,
      totalAccesses,
      cachedAccesses,
      cacheHitRate: cacheHitRate.toFixed(2) + '%',
      popularReports,
      recentlyAccessedReports
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
};

/**
 * Cleanup old/unused reports
 */
exports.cleanupReportsCache = async (req, res) => {
  try {
    const { olderThan = 90, accessCountLessThan = 2 } = req.query;
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
    
    // Find reports that meet the criteria
    const reports = await Report.find({
      lastAccessed: { $lt: cutoffDate },
      accessCount: { $lt: parseInt(accessCountLessThan) }
    });
    
    // Delete reports and their S3 objects
    let deletedCount = 0;
    let s3DeletedCount = 0;
    
    for (const report of reports) {
      try {
        // Delete from S3 if it's not 'pending'
        if (report.pdfUrl && report.pdfUrl !== 'pending') {
          await s3Service.deleteObject(report.pdfUrl);
          s3DeletedCount++;
        }
        
        // Delete the report
        await Report.findByIdAndDelete(report.id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting report ${report.id}:`, error);
      }
    }
    
    res.json({
      message: `Deleted ${deletedCount} reports and ${s3DeletedCount} S3 objects`,
      deletedCount,
      s3DeletedCount
    });
  } catch (error) {
    console.error('Error cleaning up reports cache:', error);
    res.status(500).json({ error: 'Failed to clean up reports cache' });
  }
};

/**
 * Delete a report
 */
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationName } = req.body;
    
    // Find the report
    const report = await Report.findOne({ 
      _id: id,
      user: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Verify confirmation name matches
    if (!confirmationName || confirmationName !== report.name) {
      return res.status(400).json({ 
        error: 'Confirmation name does not match report name',
        reportName: report.name 
      });
    }
    
    // Delete the report's PDF from S3 if it exists
    if (report.pdfUrl && report.pdfUrl !== 'pending') {
      try {
        await s3Service.deleteObject(report.pdfUrl);
        console.log(`Deleted PDF from S3: ${report.pdfUrl}`);
      } catch (s3Error) {
        console.error(`Error deleting PDF from S3: ${report.pdfUrl}`, s3Error);
        // Continue with report deletion even if S3 deletion fails
      }
    }
    
    // Delete the report from the database
    await Report.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Report deleted successfully',
      reportId: id,
      reportName: report.name
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
