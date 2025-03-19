const User = require('../../models/User');
const UsageStats = require('../../models/UsageStats');
const mongoose = require('mongoose');
const UsageStatsUtil = require('./UsageStatsUtil');

/**
 * Service for generating usage analytics reports
 */
class UsageAnalyticsService {
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
      const currentMonth = UsageStatsUtil.getCurrentMonth();
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
      const currentMonth = UsageStatsUtil.getCurrentMonth();
      
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

module.exports = UsageAnalyticsService; 