const User = require('../models/User');
const Report = require('../models/Report');
const UsageStats = require('../models/UsageStats');

/**
 * Service for handling usage analytics
 */
class UsageAnalyticsService {
  /**
   * Get admin analytics
   */
  static async getAdminAnalytics() {
    try {
      const totalUsers = await User.countDocuments();
      const totalReports = await Report.countDocuments();
      
      // Get reports in last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const reports24h = await Report.countDocuments({
        createdAt: { $gte: oneDayAgo }
      });
      
      const commits24h = await Report.aggregate([
        {
          $match: { createdAt: { $gte: oneDayAgo } }
        },
        {
          $unwind: '$commits'
        },
        {
          $group: {
            _id: null,
            totalCommits: { $sum: 1 }
          }
        }
      ]);
      
      return {
        totalUsers,
        totalReports,
        reports24h,
        commits24h
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      throw error;
    }
  }

  /**
   * Get token usage statistics
   */
  static async getTokenUsageStats() {
    try {
      // Aggregate token usage across all users (all time)
      const tokenStats = await UsageStats.aggregate([
        {
          $group: {
            _id: null,
            totalInputTokens: { $sum: '$tokenUsage.input' },
            totalOutputTokens: { $sum: '$tokenUsage.output' }
          }
        }
      ]);
      
      // Get current month's token usage
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthlyTokenStats = await UsageStats.aggregate([
        {
          $match: { month: currentMonth }
        },
        {
          $group: {
            _id: null,
            monthlyInputTokens: { $sum: '$tokenUsage.input' },
            monthlyOutputTokens: { $sum: '$tokenUsage.output' },
            monthlyTotal: { $sum: { $add: ['$tokenUsage.input', '$tokenUsage.output'] }}
          }
        }
      ]);
      
      const result = tokenStats[0] || { totalInputTokens: 0, totalOutputTokens: 0 };
      const monthlyResult = monthlyTokenStats[0] || { 
        monthlyInputTokens: 0, 
        monthlyOutputTokens: 0,
        monthlyTotal: 0
      };
      
      // Calculate costs
      const inputCost = (result.totalInputTokens / 1000) * 0.01;
      const outputCost = (result.totalOutputTokens / 1000) * 0.03;
      const totalCost = inputCost + outputCost;
      
      return {
        ...result,
        ...monthlyResult,
        monthlyTokens: monthlyResult.monthlyTotal,
        inputCost: parseFloat(inputCost.toFixed(2)),
        outputCost: parseFloat(outputCost.toFixed(2)),
        estimatedCost: parseFloat(totalCost.toFixed(2))
      };
    } catch (error) {
      console.error('Error getting token usage stats:', error);
      return { 
        totalInputTokens: 0, 
        totalOutputTokens: 0,
        monthlyInputTokens: 0,
        monthlyOutputTokens: 0,
        monthlyTokens: 0,
        inputCost: 0,
        outputCost: 0,
        estimatedCost: 0
      };
    }
  }

  /**
   * Get total commits processed
   */
  static async getTotalCommits() {
    try {
      // Aggregate commits across all reports
      const commitStats = await Report.aggregate([
        {
          $group: {
            _id: null,
            totalCommits: { $sum: { $size: '$commits' } }
          }
        }
      ]);
      
      return commitStats[0]?.totalCommits || 0;
    } catch (error) {
      console.error('Error getting total commits:', error);
      return 0;
    }
  }

  // ... existing methods ...
}

module.exports = { UsageAnalyticsService }; 