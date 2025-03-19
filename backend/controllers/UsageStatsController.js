const { ReportUsageTrackerService, UsageAnalyticsService } = require('../services/UsageStats');
const User = require('../models/User');

/**
 * Controller for usage statistics
 */
class UsageStatsController {
  /**
   * Get the current user's usage statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).populate('plan');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const stats = await UsageAnalyticsService.getUserUsageStats(userId);
      
      // Include plan information in response
      const response = {
        success: true,
        data: {
          ...stats,
          plan: {
            name: user.plan.name,
            displayName: user.plan.displayName,
            limits: user.plan.limits
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics',
        error: error.message
      });
    }
  }

  /**
   * Get admin analytics dashboard data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAdminStats(req, res) {
    try {
      // Check if user is admin
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      
      const stats = await UsageAnalyticsService.getAdminAnalytics();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin statistics',
        error: error.message
      });
    }
  }

  /**
   * Check if user has reached their report limit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async checkReportLimit(req, res) {
    try {
      const userId = req.user.id;
      const hasReachedLimit = await ReportUsageTrackerService.hasReachedReportLimit(userId);
      
      res.status(200).json({
        success: true,
        hasReachedLimit,
        data: {
          canGenerateReport: !hasReachedLimit
        }
      });
    } catch (error) {
      console.error('Error checking report limit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check usage limits',
        error: error.message
      });
    }
  }
}

module.exports = UsageStatsController;