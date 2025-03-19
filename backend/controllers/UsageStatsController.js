const { ReportUsageTrackerService, UsageAnalyticsService } = require('../services/UsageStats');
const User = require('../models/User');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Controller for usage statistics
 */
class UsageStatsController {
  /**
   * Get the current user's usage statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getUserStats(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).populate('plan');
      
      if (!user) {
        throw new NotFoundError('User not found');
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
      next(error);
    }
  }

  /**
   * Get admin analytics dashboard data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAdminStats(req, res, next) {
    try {
      // Check if user is admin
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user || user.role !== 'admin') {
        throw new AuthorizationError('Access denied. Admin privileges required.');
      }
      
      const stats = await UsageAnalyticsService.getAdminAnalytics();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has reached their report limit
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async checkReportLimit(req, res, next) {
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
      next(error);
    }
  }
}

module.exports = UsageStatsController;