const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs').promises;
const CommitSummary = require('../models/CommitSummary');
const { getReportPrompt } = require('../templates/reportPrompt');
const { getCommitSummaryPrompt } = require('../templates/commitSummaryPrompt');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    
    let summary = fallbackSummary;
    let usage = null;
    let model = null;
    
    try {
      // Use the new template for the OpenAI analysis
      const prompt = getCommitSummaryPrompt({
        repository,
        commitSha: commit.sha,
        authorName: commit.author?.name || commit.author?.login || 'Unknown',
        message: commit.message,
        diff: commit.diff
      });

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a technical expert analyzing code changes. Provide clear, accurate, and concise summaries of what work was accomplished in a commit.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      });

      // Extract the summary from the response
      summary = response.choices[0].message.content.trim();
      
      // Track token usage if requested
      if (trackTokens && response.usage) {
        usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        };
        model = response.model || process.env.OPENAI_MODEL || 'gpt-4o';
      }
      
      if (!summary || summary.length === 0) {
        console.log(`No summary generated for commit ${commit.sha.substring(0, 7)}, using fallback`);
        summary = fallbackSummary;
      }
    } catch (error) {
      console.error(`Error generating summary for commit ${commit.sha.substring(0, 7)}:`, error);
      // Use the fallback summary if OpenAI fails
      console.log(`Using fallback summary for commit ${commit.sha.substring(0, 7)}`);
    }

    // Save the summary to the database
    const newSummary = new CommitSummary({
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

    await newSummary.save();
    console.log(`Saved new summary for commit ${commit.sha.substring(0, 7)}`);

    // Return the analyzed commit data with usage info if available
    const result = {
      sha: commit.sha,
      message: commit.message || 'No message',
      author: commit.author?.name || commit.author?.login || 'Unknown',
      date: commit.date || new Date(),
      summary,
      filesChanged: commit.filesChanged || 0,
      fromCache: false
    };
    
    // Add token usage if tracked
    if (trackTokens && usage) {
      result.usage = usage;
      result.model = model;
    }
    
    return result;
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
   * Analyze a commit using OpenAI
   */
  async analyzeCommit({ commitMessage, diff, repository, commitSha, authorName }) {
    try {
      // Truncate the diff if it's too large
      const maxDiffLength = 15000;
      const truncatedDiff = diff.length > maxDiffLength 
        ? diff.substring(0, maxDiffLength) + '... [diff truncated due to size]'
        : diff;
      
      // Use the template for OpenAI
      const prompt = getCommitSummaryPrompt({
        repository: repository || 'unknown',
        commitSha: commitSha || 'unknown',
        authorName: authorName || 'Unknown',
        message: commitMessage,
        diff: truncatedDiff
      });

      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a technical expert analyzing code changes. Provide clear, accurate, and concise summaries of what work was accomplished in a commit.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
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
   * @param {Object} options - Report generation options
   * @param {string} options.repository - Repository name
   * @param {Array} options.commits - List of commits
   * @param {string} options.title - Report title
   * @param {boolean} options.includeCode - Whether to include code snippets
   * @param {string} options.branchInfo - Branch information
   * @param {string} options.authorInfo - Author information
   * @param {boolean} options.trackTokens - Whether to track token usage
   * @returns {Promise<Object>} - Generated report with usage statistics if trackTokens is enabled
   */
  async generateReportFromCommits({ repository, commits, title, includeCode, branchInfo, authorInfo, trackTokens = true }) {
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
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a technical writer and expert at creating executive summary reports that translate technical development work into business value. Your reports are concise, well-structured, and focus on outcomes rather than implementation details.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2500,
        temperature: 0.7
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
        result.model = response.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
      }
      
      console.log('OpenAI report generated:', {
        resultType: typeof result,
        hasContent: !!result.content,
        contentType: typeof result.content,
        contentLength: result.content.length,
        contentSample: result.content.substring(0, 200) + '...',
        trackingTokens: trackTokens,
        tokenUsage: trackTokens ? result.usage : 'Not tracked'
      });
      
      return result;
    } catch (error) {
      console.error('Error generating report with OpenAI:', error);
      throw new Error('Failed to generate report: ' + error.message);
    }
  }
};

module.exports = openaiService;