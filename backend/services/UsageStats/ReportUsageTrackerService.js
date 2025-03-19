const User = require('../../models/User');
const UsageStats = require('../../models/UsageStats');
const UsageStatsUtil = require('./UsageStatsUtil');

/**
 * Service for tracking report usage
 */
class ReportUsageTrackerService {
  /**
   * Track report generation
   * @param {string} userId - User ID
   * @param {string} reportType - Type of report ('standard' or 'large')
   */
  static async trackReportGeneration(userId, reportType) {
    try {
      console.log('Tracking report generation:', {
        userId,
        reportType,
        timestamp: new Date().toISOString()
      });

      const currentMonth = UsageStatsUtil.getCurrentMonth();

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
      const currentMonth = UsageStatsUtil.getCurrentMonth();
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
}

module.exports = ReportUsageTrackerService; 