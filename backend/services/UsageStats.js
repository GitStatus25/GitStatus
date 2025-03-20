const User = require('../models/User');
const Report = require('../models/Report');
const UsageStats = require('../models/UsageStats');
const RequestLog = require('../models/RequestLog');

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
      
      // Get API requests in last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const apiRequests24h = await RequestLog.countDocuments({
        timestamp: { $gte: oneDayAgo }
      });
      
      return {
        totalUsers,
        totalReports,
        apiRequests24h
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
      // Aggregate token usage across all users
      const tokenStats = await UsageStats.aggregate([
        {
          $group: {
            _id: null,
            totalInputTokens: { $sum: '$tokenUsage.input' },
            totalOutputTokens: { $sum: '$tokenUsage.output' }
          }
        }
      ]);
      
      const result = tokenStats[0] || { totalInputTokens: 0, totalOutputTokens: 0 };
      
      // Calculate estimated cost (example rates: $0.01/1K input tokens, $0.03/1K output tokens)
      const inputCost = (result.totalInputTokens / 1000) * 0.01;
      const outputCost = (result.totalOutputTokens / 1000) * 0.03;
      
      return {
        ...result,
        estimatedCost: parseFloat((inputCost + outputCost).toFixed(2))
      };
    } catch (error) {
      console.error('Error getting token usage stats:', error);
      return { totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 };
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