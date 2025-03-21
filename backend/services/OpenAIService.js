const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs').promises;
const CommitSummary = require('../models/CommitSummary');
const { getReportPrompt } = require('../templates/reportPrompt');
const { getCommitSummaryPrompt } = require('../templates/commitSummaryPrompt');
const openaiConfig = require('../config/openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Lazy load QueueService to avoid circular dependency
let QueueService;

/**
 * Get or create a commit summary
 * @param {Object} commit - Commit data
 * @param {string} repository - Repository name
 * @param {boolean} trackTokens - Whether to track token usage
 * @returns {Promise<Object>} - The commit summary with usage statistics if trackTokens is enabled
 */
const getOrCreateCommitSummary = async (commit, repository, trackTokens = true) => {
  try {
    // Check if this commit summary already exists in the database
    const existingSummary = await CommitSummary.findOne({
      repository,
      commitId: commit.sha
    });

    // If the summary exists, update the lastAccessed timestamp and return it
    if (existingSummary) {
      console.log(`Using cached summary for commit ${commit.sha.substring(0, 7)}`);
      
      // Update the lastAccessed timestamp
      existingSummary.lastAccessed = new Date();
      await existingSummary.save();
      
      return {
        sha: existingSummary.commitId,
        message: existingSummary.message,
        author: existingSummary.author,
        date: existingSummary.date,
        summary: existingSummary.summary,
        filesChanged: existingSummary.filesChanged || 0,
        fromCache: true
      };
    }

    // Summary doesn't exist, so we need to generate it
    console.log(`Generating new summary for commit ${commit.sha.substring(0, 7)}`);
    
    // Get a simple summary from the commit message as a fallback
    const fallbackSummary = commit.message ? 
      commit.message.split('\n')[0].substring(0, 100) : 
      'No summary available';
    
    // Lazy load QueueService to avoid circular dependency
    if (!QueueService) {
      QueueService = require('./QueueService');
    }
    
    // Add job to the queue
    const jobInfo = await QueueService.addSummaryGenerationJob(commit, repository, trackTokens);
    
    // Return a placeholder with the fallback summary
    // The real summary will be generated in the background
    return {
      sha: commit.sha,
      message: commit.message || 'No message',
      author: commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.date || new Date(),
      summary: fallbackSummary,
      filesChanged: commit.filesChanged || 0,
      fromCache: false,
      jobId: jobInfo.id,
      status: 'pending'
    };
    
  } catch (error) {
    console.error(`Error in commit summary cache for ${commit.sha}:`, error);
    // If caching fails, still return the commit with a default summary
    return {
      sha: commit.sha,
      message: commit.message || 'No message',
      author: commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.date || new Date(),
      summary: commit.message ? commit.message.split('\n')[0].substring(0, 100) : 'No summary available',
      filesChanged: commit.filesChanged || 0,
      fromCache: false
    };
  }
};

/**
 * Service for interacting with the OpenAI API
 */
const openaiService = {
  /**
   * Queue a commit for summary generation
   * 
   * @param {Object} commit - Commit data
   * @param {string} repository - Repository name
   * @param {boolean} trackTokens - Whether to track token usage
   * @param {string} reportId - Optional report ID to associate with this summary
   * @returns {Promise<Object>} - Job information with id
   */
  async queueCommitSummary(commit, repository, trackTokens = true, reportId = null) {
    try {
      // Lazy load QueueService to avoid circular dependency
      if (!QueueService) {
        QueueService = require('./QueueService');
      }
      
      // Add job to the queue
      const jobInfo = await QueueService.addSummaryGenerationJob(commit, repository, trackTokens, reportId);
      
      return {
        id: jobInfo.id,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error queueing commit summary:', error);
      throw error;
    }
  },

  /**
   * Analyze a commit using OpenAI
   */
  async analyzeCommit({ commitMessage, commitDiff, commitSha, commitAuthor, commitDate }) {
    try {
      // Truncate the diff if it's too large
      const maxDiffLength = 15000;
      console.log(commitDiff)
      const truncatedDiff = commitDiff.length > maxDiffLength 
        ? commitDiff.substring(0, maxDiffLength) + '... [diff truncated due to size]'
        : commitDiff;
      
      // Use the template for OpenAI
      const prompt = getCommitSummaryPrompt({
        commitSha: commitSha || 'unknown',
        authorName: commitAuthor || 'Unknown',
        message: commitMessage,
        diff: truncatedDiff
      });

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: openaiConfig.models.commitAnalysis,
        messages: [
          { role: 'system', content: 'You are a technical expert analyzing code changes. Provide clear, accurate, and concise summaries of what work was accomplished in a commit.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: openaiConfig.tokenLimits.commitAnalysisMaxTokens,
        temperature: openaiConfig.temperature.commitAnalysis
      });

      // Return the generated summary
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error analyzing commit with OpenAI:', error);
      return 'Could not analyze this commit due to an error.';
    }
  },
  
  /**
   * Analyze a list of commits using OpenAI
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} - Analyzed commits
   */
  analyzeCommits: async (options) => {
    const { repository, commits, trackTokens = false } = options;
    
    try {
      // Process commits in parallel with a concurrency limit of 3
      const analyzedCommits = [];
      const concurrencyLimit = 3;
      
      // Process commits in batches
      for (let i = 0; i < commits.length; i += concurrencyLimit) {
        const batch = commits.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(commit => getOrCreateCommitSummary(commit, repository, trackTokens))
        );
        analyzedCommits.push(...batchResults);
      }
      
      return analyzedCommits;
    } catch (error) {
      console.error('Error analyzing commits:', error);
      // If OpenAI analysis fails, return the original commits
      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.message,
        author: commit.author?.name || commit.author?.login || 'Unknown',
        date: commit.date || new Date(),
        summary: 'OpenAI analysis failed.',
        filesChanged: commit.filesChanged || 0,
        fromCache: false
      }));
    }
  },
  
  /**
   * Generate a comprehensive report from a list of commits
   * This implementation is used directly by the Queue Service
   * 
   * @param {Object} options - Report generation options
   * @returns {Promise<Object>} - Generated report with usage statistics if trackTokens is enabled
   */
  async _generateReportFromCommits(options) {
    const { repository, commits, title, includeCode, branchInfo, authorInfo, trackTokens = true } = options;
    
    try {
      console.log(`Generating report for ${repository} with ${commits.length} commits`);

      // First, ensure all commits have summaries using our caching system
      const analyzedCommits = await this.analyzeCommits({
        repository,
        commits,
        trackTokens
      });

      // Format the commits for the prompt
      const commitsText = analyzedCommits.map((commit, index) => {
        return `
Commit ${index + 1}:
- SHA: ${commit.sha}
- Author: ${commit.author}
- Message: ${commit.message}
- Summary: ${commit.summary}
- Date: ${new Date(commit.date).toISOString().split('T')[0]}
${includeCode && commit.diff ? `\nChanges:\n${commit.diff.substring(0, 500)}${commit.diff.length > 500 ? '...(truncated)' : ''}` : ''}
`;
      }).join('\n');

      // Extract date range information
      const startDate = new Date(Math.min(...analyzedCommits.map(c => new Date(c.date).getTime())));
      const endDate = new Date(Math.max(...analyzedCommits.map(c => new Date(c.date).getTime())));

      const dateRangeFormatted = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;

      // Construct the prompt for the report generation
      const prompt = getReportPrompt({
        repository,
        title,
        dateRangeFormatted,
        includeCode,
        commitsText,
        branchInfo,
        authorInfo
      });

      console.log('Sending report generation request to OpenAI');
      
      // Call the OpenAI API for report generation
      const response = await openai.chat.completions.create({
        model: openaiConfig.models.reportGeneration,
        messages: [
          { 
            role: 'system', 
            content: 'You are a technical writer and expert at creating executive summary reports that translate technical development work into business value. Your reports are concise, well-structured, and focus on outcomes rather than implementation details.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: openaiConfig.tokenLimits.reportGenerationMaxTokens,
        temperature: openaiConfig.temperature.reportGeneration
      });

      // Create the result object
      const result = {
        title,
        content: response.choices[0].message.content.trim(),
        repository,
        commitCount: commits.length,
        dateGenerated: new Date()
      };
      
      // Add token usage information if requested
      if (trackTokens && response.usage) {
        result.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        };
        result.model = response.model || openaiConfig.models.reportGeneration;
      }
      
      return result;
    } catch (error) {
      console.error('Error generating report with OpenAI:', error);
      throw error;
    }
  },
  
  /**
   * Public interface for report generation that returns a job ID
   * and triggers background processing
   * 
   * @param {Object} options - Report generation options
   * @param {string} reportId - Optional report ID to update when complete
   * @returns {Promise<Object>} - Job information with ID and status
   */
  async generateReportFromCommits(options, reportId = null) {
    try {
      // Lazy load QueueService to avoid circular dependency
      if (!QueueService) {
        QueueService = require('./QueueService');
      }
      
      // Add options to include reportId
      const jobOptions = {
        ...options,
        reportId
      };
      
      // Add job to the queue
      const jobInfo = await QueueService.addReportGenerationJob(jobOptions);
      
      return {
        id: jobInfo.id,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error queueing report generation:', error);
      throw error;
    }
  },
  
  /**
   * Get the status of a summary generation job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Job status information
   */
  async getSummaryJobStatus(jobId) {
    // Lazy load QueueService to avoid circular dependency
    if (!QueueService) {
      QueueService = require('./QueueService');
    }
    
    return await QueueService.getSummaryJobStatus(jobId);
  },
  
  /**
   * Get the status of a report generation job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Job status information
   */
  async getReportJobStatus(jobId) {
    // Lazy load QueueService to avoid circular dependency
    if (!QueueService) {
      QueueService = require('./QueueService');
    }
    
    return await QueueService.getReportJobStatus(jobId);
  }
};

module.exports = openaiService;