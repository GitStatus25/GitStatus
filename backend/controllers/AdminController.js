const User = require('../models/User');
const UsageStatsService = require('../services/UsageStatsService');

/**
 * Admin controller for user management and analytics
 */
class AdminController {
  /**
   * Get all users (admin only)
   */
  static async getUsers(req, res) {
    try {
      const users = await User.find({}, { accessToken: 0 }); // Exclude access token
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(req, res) {
    try {
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role },
        { new: true, select: '-accessToken' }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user role', error: error.message });
    }
  }

  /**
   * Get admin analytics (admin only)
   */
  static async getAnalytics(req, res) {
    try {
      const analytics = await UsageStatsService.getAdminAnalytics();
      res.json({ analytics });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
  }
}

module.exports = AdminController; 