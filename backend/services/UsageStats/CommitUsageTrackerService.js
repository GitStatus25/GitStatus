const UsageStats = require('../../models/UsageStats');
const UsageStatsUtil = require('./UsageStatsUtil');

/**
 * Service for tracking commit usage
 */
class CommitUsageTrackerService {
  /**
   * Track commit analysis events
   * @param {string} userId - The user ID
   * @param {number} commitCount - Number of commits analyzed
   * @param {number} summarizedCount - Number of commits summarized
   * @returns {Promise<void>}
   */
  static async trackCommitAnalysis(userId, commitCount, summarizedCount = 0) {
    try {
      const currentMonth = UsageStatsUtil.getCurrentMonth();

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
}

module.exports = CommitUsageTrackerService; 