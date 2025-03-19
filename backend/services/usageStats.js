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
  async trackReportGeneration(userId, reportType) {
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Get user's plan
      const user = await User.findById(userId).populate('plan');
      if (!user || !user.plan) {
        throw new Error('User plan not found');
      }
      
      // Update or create monthly stats
      const stats = await UsageStats.findOneAndUpdate(
        { user: userId, month: monthKey },
        {
          $inc: {
            [`reports.${reportType}`]: 1,
            'reports.total': 1
          }
        },
        { upsert: true, new: true }
      );
      
      // Update user's current usage
      await User.findByIdAndUpdate(userId, {
        $inc: {
          [`currentUsage.reportsGenerated.${reportType}`]: 1,
          'currentUsage.reportsGenerated.total': 1
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error tracking report generation:', error);
      throw error;
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

      // Update user's current usage count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'currentUsage.commitsAnalyzed': commitCount }
      });

      // Update monthly stats
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
   * @param {number} inputTokenCount - Number of input tokens used
   * @param {number} outputTokenCount - Number of output tokens used
   * @param {string} modelName - Name of the AI model used
   * @param {number} totalCost - Total estimated cost in USD
   * @param {number} inputCost - Estimated cost for input tokens in USD
   * @param {number} outputCost - Estimated cost for output tokens in USD
   * @returns {Promise<void>}
   */
  static async trackTokenUsage(
    userId, 
    inputTokenCount, 
    outputTokenCount, 
    modelName = 'default', 
    totalCost = 0,
    inputCost = 0,
    outputCost = 0
  ) {
    try {
      const currentMonth = this.getCurrentMonth();
      const totalTokenCount = inputTokenCount + outputTokenCount;

      // Update monthly stats
      const updateQuery = {
        $inc: {
          // Update total token counts
          'tokenUsage.total': totalTokenCount,
          'tokenUsage.input': inputTokenCount,
          'tokenUsage.output': outputTokenCount,
          
          // Update cost estimates
          'costEstimate.total': totalCost,
          'costEstimate.input': inputCost,
          'costEstimate.output': outputCost
        }
      };

      // Add model breakdowns
      updateQuery.$inc[`tokenUsage.byModel.${modelName}`] = totalTokenCount;
      updateQuery.$inc[`tokenUsage.inputByModel.${modelName}`] = inputTokenCount;
      updateQuery.$inc[`tokenUsage.outputByModel.${modelName}`] = outputTokenCount;
      
      // Add cost breakdowns
      if (totalCost > 0) {
        updateQuery.$inc[`costEstimate.byService.${modelName}`] = totalCost;
      }
      
      if (inputCost > 0) {
        updateQuery.$inc[`costEstimate.inputByService.${modelName}`] = inputCost;
      }
      
      if (outputCost > 0) {
        updateQuery.$inc[`costEstimate.outputByService.${modelName}`] = outputCost;
      }

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
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Check if we need to reset the counter (new month)
      const lastReset = new Date(user.currentUsage.lastResetDate);
      const now = new Date();
      
      if (lastReset.getMonth() !== now.getMonth() || 
          lastReset.getFullYear() !== now.getFullYear()) {
        // Reset counters for new month
        await User.findByIdAndUpdate(userId, {
          'currentUsage.reportsGenerated': 0,
          'currentUsage.commitsAnalyzed': 0,
          'currentUsage.lastResetDate': now
        });
        return false;
      }

      return user.currentUsage.reportsGenerated >= user.plan.limits.reportsPerMonth;
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

      // Get current month's stats using the same format as tracking methods
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
                  { $ifNull: ['$reports.small', 0] },
                  { $ifNull: ['$reports.big', 0] }
                ]
              }
            },
            commits: { 
              $sum: {
                $add: [
                  { $ifNull: ['$commits.small', 0] },
                  { $ifNull: ['$commits.big', 0] }
                ]
              }
            },
            tokenUsage: { $sum: '$tokenUsage.total' }
          }
        }
      ]);

      // Get current usage from user model
      const currentUsage = {
        reportsGenerated: {
          small: user.currentUsage?.reportsGenerated?.small || 0,
          big: user.currentUsage?.reportsGenerated?.big || 0,
          total: (user.currentUsage?.reportsGenerated?.small || 0) + 
                 (user.currentUsage?.reportsGenerated?.big || 0)
        },
        commitsAnalyzed: user.currentUsage?.commitsAnalyzed || 0
      };

      return {
        plan: user.plan,
        currentUsage,
        currentMonthStats: currentMonthStats || {
          reports: { 
            small: 0,
            big: 0,
            total: 0
          },
          commits: { 
            small: 0,
            big: 0,
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
      const monthlyStats = await UsageStats.aggregate([
        { $match: { month: currentMonth } },
        { 
          $group: {
            _id: null,
            totalReports: { $sum: '$reports.total' },
            totalCommits: { $sum: '$commits.summarized' },
            totalTokens: { $sum: '$tokenUsage.total' },
            inputTokens: { $sum: '$tokenUsage.input' },
            outputTokens: { $sum: '$tokenUsage.output' },
            totalCost: { $sum: '$costEstimate.total' },
            inputCost: { $sum: '$costEstimate.input' },
            outputCost: { $sum: '$costEstimate.output' },
            uniqueUsers: { $addToSet: '$user' }
          }
        }
      ]);

      // Get user breakdown
      const userBreakdown = await UsageStats.aggregate([
        { $match: { month: currentMonth } },
        {
          $project: {
            user: 1,
            reportsTotal: '$reports.total',
            commitsTotal: '$commits.summarized',
            tokensTotal: '$tokenUsage.total',
            inputTokens: '$tokenUsage.input',
            outputTokens: '$tokenUsage.output',
            costTotal: '$costEstimate.total',
            inputCost: '$costEstimate.input',
            outputCost: '$costEstimate.output'
          }
        },
        { $sort: { reportsTotal: -1 } },
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
        reports: item.reportsTotal,
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
        summary: monthlyStats[0] || {
          totalReports: 0,
          totalCommits: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          uniqueUsers: []
        },
        topUsers: userStats
      };
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }
}

module.exports = UsageStatsService;