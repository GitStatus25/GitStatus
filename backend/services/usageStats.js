const User = require('../models/User');
const UsageStats = require('../models/UsageStats');
const mongoose = require('mongoose');

/**
 * Service for handling usage statistics tracking
 */
class UsageStatsService {
  /**
   * Get the current month in YYYY-MM format
   * @returns {string} Current month in YYYY-MM format
   */
  static getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Track report generation
   * @param {string} userId - User ID
   * @param {string} reportType - Type of report ('small' or 'big')
   */
  static async trackReportGeneration(userId, reportType) {
    try {
      console.log('Tracking report generation:', {
        userId,
        reportType,
        timestamp: new Date().toISOString()
      });

      const currentMonth = this.getCurrentMonth();

      // Update monthly stats
      const updateResult = await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        {
          $inc: {
            [`reports.${reportType}`]: 1
          }
        },
        { upsert: true, new: true }
      );

      console.log('Usage stats update result:', {
        userId,
        reportType,
        currentMonth,
        updateResult
      });
    } catch (error) {
      console.error('Error tracking report generation:', error);
    }
  }

  /**
   * Track commit analysis events
   * @param {string} userId - The user ID
   * @param {number} commitCount - Number of commits analyzed
   * @param {number} summarizedCount - Number of commits summarized
   * @returns {Promise<void>}
   */
  static async trackCommitAnalysis(userId, commitCount, summarizedCount = 0) {
    try {
      const currentMonth = this.getCurrentMonth();

      // Update monthly stats only
      await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        {
          $inc: {
            'commits.total': commitCount  // Use actual commit count
          }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking commit analysis:', error);
    }
  }

  /**
   * Track token usage for AI services
   * @param {string} userId - The user ID
   * @param {number} inputTokens - Number of input tokens used
   * @param {number} outputTokens - Number of output tokens used
   * @param {string} model - Model name used
   * @param {number} totalCost - Total cost of the operation
   * @param {number} inputCost - Cost of input tokens
   * @param {number} outputCost - Cost of output tokens
   * @returns {Promise<void>}
   */
  static async trackTokenUsage(userId, inputTokens, outputTokens, model, totalCost, inputCost, outputCost) {
    try {
      const currentMonth = this.getCurrentMonth();
      const totalTokens = inputTokens + outputTokens;

      // Update monthly stats only
      const updateQuery = {
        $inc: {
          'tokenUsage.total': totalTokens,
          'tokenUsage.input': inputTokens,
          'tokenUsage.output': outputTokens,
          'costEstimate.total': totalCost,
          'costEstimate.input': inputCost,
          'costEstimate.output': outputCost
        }
      };

      // Add model-specific token usage
      updateQuery.$inc[`tokenUsage.byModel.${model}`] = totalTokens;
      updateQuery.$inc[`tokenUsage.inputByModel.${model}`] = inputTokens;
      updateQuery.$inc[`tokenUsage.outputByModel.${model}`] = outputTokens;

      await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        updateQuery,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking token usage:', error);
    }
  }

  /**
   * Check if user has reached their monthly report limit
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} True if limit reached
   */
  static async hasReachedReportLimit(userId) {
    try {
      const user = await User.findById(userId).populate('plan');
      if (!user) throw new Error('User not found');
      if (!user.plan) throw new Error('User plan not found');

      // Get current month's stats
      const currentMonth = this.getCurrentMonth();
      const currentMonthStats = await UsageStats.findOne({
        user: userId,
        month: currentMonth
      });

      // If no stats for this month, user hasn't reached limit
      if (!currentMonthStats) return false;

      // Check standard and large report limits separately
      const standardReports = currentMonthStats.reports.standard || 0;
      const largeReports = currentMonthStats.reports.large || 0;
      
      // Large reports are limited to 10% of standard report limit
      const largeReportLimit = Math.floor(user.plan.limits.reportsPerMonth * 0.1);
      
      return standardReports >= user.plan.limits.reportsPerMonth ||
             largeReports >= largeReportLimit;
    } catch (error) {
      console.error('Error checking report limit:', error);
      // Default to false to prevent blocking users due to errors
      return false;
    }
  }

  /**
   * Get user's current usage statistics
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} User usage data
   */
  static async getUserUsageStats(userId) {
    try {
      // Get user's plan
      const user = await User.findById(userId).populate('plan');
      if (!user) {
        throw new Error('User not found');
      }

      // Get current month's stats
      const currentMonth = this.getCurrentMonth();
      const currentMonthStats = await UsageStats.findOne({
        user: userId,
        month: currentMonth
      });

      // Get all-time stats using aggregation
      const allTimeStats = await UsageStats.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            reports: { 
              $sum: {
                $add: [
                  { $ifNull: ['$reports.standard', 0] },
                  { $ifNull: ['$reports.large', 0] }
                ]
              }
            },
            commits: { 
              $sum: { $ifNull: ['$commits.total', 0] }
            },
            tokenUsage: { $sum: '$tokenUsage.total' }
          }
        }
      ]);

      return {
        plan: user.plan,
        currentMonthStats: currentMonthStats || {
          reports: { 
            standard: 0,
            large: 0
          },
          commits: { 
            total: 0
          },
          tokenUsage: { 
            total: 0,
            input: 0,
            output: 0
          }
        },
        allTimeStats: allTimeStats[0] || {
          reports: 0,
          commits: 0,
          tokenUsage: 0
        }
      };
    } catch (error) {
      console.error('Error in getUserUsageStats:', error);
      throw error;
    }
  }

  /**
   * Get admin analytics overview
   * @returns {Promise<Object>} System-wide usage statistics
   */
  static async getAdminAnalytics() {
    try {
      const currentMonth = this.getCurrentMonth();
      
      // Get aggregated stats for current month
      let monthlyStats = await UsageStats.aggregate([
        { $match: { month: currentMonth } },
        { 
          $group: {
            _id: null,
            reportsStandard: { $sum: { $ifNull: ['$reports.standard', 0] } },
            reportsLarge: { $sum: { $ifNull: ['$reports.large', 0] } },
            commitsTotal: { $sum: { $ifNull: ['$commits.total', 0] } },
            totalTokens: { $sum: { $ifNull: ['$tokenUsage.total', 0] } },
            inputTokens: { $sum: { $ifNull: ['$tokenUsage.input', 0] } },
            outputTokens: { $sum: { $ifNull: ['$tokenUsage.output', 0] } },
            totalCost: { $sum: { $ifNull: ['$costEstimate.total', 0] } },
            inputCost: { $sum: { $ifNull: ['$costEstimate.input', 0] } },
            outputCost: { $sum: { $ifNull: ['$costEstimate.output', 0] } },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ]);

      monthlyStats = monthlyStats[0] || {
        reportsStandard: 0,
        reportsLarge: 0,
        commitsTotal: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        uniqueUsers: []
      };

      monthlyStats.totalReports = monthlyStats.reportsStandard + monthlyStats.reportsLarge;

      // Get user breakdown
      let userBreakdown = await UsageStats.aggregate([
        { $match: { month: currentMonth } },
        {
          $project: {
            user: 1,
            reportsStandard: { $ifNull: ['$reports.standard', 0] },
            reportsLarge: { $ifNull: ['$reports.large', 0] },
            commitsTotal: { $ifNull: ['$commits.total', 0] },
            tokensTotal: { $ifNull: ['$tokenUsage.total', 0] },
            inputTokens: { $ifNull: ['$tokenUsage.input', 0] },
            outputTokens: { $ifNull: ['$tokenUsage.output', 0] },
            costTotal: { $ifNull: ['$costEstimate.total', 0] },
            inputCost: { $ifNull: ['$costEstimate.input', 0] },
            outputCost: { $ifNull: ['$costEstimate.output', 0] }
          }
        },
        { $sort: { reportsStandard: -1 } },
        { $limit: 10 }
      ]);

      // Map user IDs to usernames
      const userIds = userBreakdown.map(item => item.user);
      const users = await User.find({ _id: { $in: userIds } }, { username: 1 });
      const userMap = users.reduce((map, user) => {
        map[user._id.toString()] = user.username;
        return map;
      }, {});

      const userStats = userBreakdown.map(item => ({
        username: userMap[item.user.toString()] || 'Unknown',
        reports: item.reportsStandard + item.reportsLarge,
        commits: item.commitsTotal,
        tokens: {
          total: item.tokensTotal,
          input: item.inputTokens,
          output: item.outputTokens
        },
        cost: {
          total: item.costTotal,
          input: item.inputCost,
          output: item.outputCost
        }
      }));

      return {
        currentMonth,
        summary: monthlyStats,
        topUsers: userStats
      };
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }
}

module.exports = UsageStatsService;