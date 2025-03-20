const User = require('../models/User');
const PlanService = require('./PlanService');

class AuthService {
  /**
   * Create or update user from GitHub profile
   * @param {Object} profile - GitHub profile
   * @param {string} accessToken - GitHub access token
   * @returns {Promise<Object>} User object
   */
  static async handleGitHubAuth(profile, accessToken) {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        // Update existing user
        user.accessToken = accessToken;
        user.name = profile.displayName || profile.username;
        user.avatarUrl = profile._json.avatarUrl;
        if (profile.emails && profile.emails.length > 0) {
          user.email = profile.emails[0].value;
        }

        // Ensure user has a plan
        if (!user.plan) {
          const defaultPlan = await PlanService.getDefaultPlan();
          user.plan = defaultPlan._id;
        }

        await user.save();
      } else {
        // Get default plan for new user
        const defaultPlan = await PlanService.getDefaultPlan();
        
        // Create new user
        user = await User.create({
          githubId: profile.id,
          username: profile.username,
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value,
          avatarUrl: profile._json.avatarUrl,
          accessToken,
          plan: defaultPlan._id
        });
      }

      return user;
    } catch (error) {
      console.error('Error in handleGitHubAuth:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with plan details
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object with plan
   */
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId).populate('plan');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }
}

module.exports = AuthService; 