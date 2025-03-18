const User = require('../models/User');
const UsageStats = require('../models/UsageStats');

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
   * Track a report generation event
   * @param {string} userId - The user ID
   * @param {string} reportType - Type of report generated (optional)
   * @returns {Promise<void>}
   */
  static async trackReportGeneration(userId, reportType = 'default') {
    try {
      const currentMonth = this.getCurrentMonth();

      // Update user's current usage count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'currentUsage.reportsGenerated': 1 }
      });

      // Update or create monthly stats
      const updateQuery = {
        $inc: {
          'reports.total': 1
        }
      };
      
      // Add report type to the breakdown if provided
      updateQuery.$inc[`reports.byType.${reportType}`] = 1;

      await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        updateQuery,
        { upsert: true, new: true }
      );
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

      // Update user's current usage count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'currentUsage.commitsAnalyzed': commitCount }
      });

      // Update monthly stats
      await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        {
          $inc: {
            'commits.total': commitCount,
            'commits.summarized': summarizedCount
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
   * @param {number} tokenCount - Number of tokens used
   * @param {string} modelName - Name of the AI model used
   * @param {number} cost - Estimated cost in USD
   * @returns {Promise<void>}
   */
  static async trackTokenUsage(userId, tokenCount, modelName = 'default', cost = 0) {
    try {
      const currentMonth = this.getCurrentMonth();

      // Update monthly stats
      const updateQuery = {
        $inc: {
          'tokenUsage.total': tokenCount,
          'costEstimate.total': cost
        }
      };

      // Add model breakdown if provided
      updateQuery.$inc[`tokenUsage.byModel.${modelName}`] = tokenCount;
      
      // Add cost breakdown if provided
      if (cost > 0) {
        updateQuery.$inc[`costEstimate.byService.${modelName}`] = cost;
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

      return user.currentUsage.reportsGenerated >= user.usageLimits.reportsPerMonth;
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
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const currentMonth = this.getCurrentMonth();
      const monthlyStats = await UsageStats.findOne({ 
        user: userId, 
        month: currentMonth 
      });

      return {
        limits: user.usageLimits,
        currentUsage: user.currentUsage,
        monthlyStats: monthlyStats || {
          reports: { total: 0 },
          commits: { total: 0, summarized: 0 },
          tokenUsage: { total: 0 },
          costEstimate: { total: 0 }
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
            totalCommits: { $sum: '$commits.total' },
            totalTokens: { $sum: '$tokenUsage.total' },
            totalCost: { $sum: '$costEstimate.total' },
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
            commitsTotal: '$commits.total',
            tokensTotal: '$tokenUsage.total',
            costTotal: '$costEstimate.total'
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
        tokens: item.tokensTotal,
        cost: item.costTotal
      }));

      return {
        currentMonth,
        summary: monthlyStats[0] || {
          totalReports: 0,
          totalCommits: 0,
          totalTokens: 0,
          totalCost: 0,
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