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
        numUniqueUsers: 0
      };
      monthlyStats.numUniqueUsers = monthlyStats.uniqueUsers.length;
      monthlyStats.totalReports = monthlyStats.reportsStandard + monthlyStats.reportsLarge;

      if (monthlyStats.totalTokens == 0) {
        monthlyStats.totalTokens = monthlyStats.inputTokens + monthlyStats.outputTokens;
      }

      if (monthlyStats.totalCost == 0) {
        monthlyStats.totalCost = monthlyStats.inputCost + monthlyStats.outputCost;
      }


      // Get aggregated stats all time
      let allTimeStats = await UsageStats.aggregate([
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

      allTimeStats = allTimeStats[0] || {
        reportsStandard: 0,
        reportsLarge: 0,
        commitsTotal: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        numUniqueUsers: 0
      };

      allTimeStats.numUniqueUsers = allTimeStats.uniqueUsers.length;
      allTimeStats.totalReports = allTimeStats.reportsStandard + allTimeStats.reportsLarge;
      if (allTimeStats.totalTokens == 0) {
        allTimeStats.totalTokens = allTimeStats.inputTokens + allTimeStats.outputTokens;
      }
      if (allTimeStats.totalCost == 0) {
        allTimeStats.totalCost = allTimeStats.inputCost + allTimeStats.outputCost;
      }

      return {
        currentMonth,
        monthlyStats: monthlyStats,
        allTimeStats: allTimeStats
      };
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }


}

module.exports = UsageAnalyticsService; 