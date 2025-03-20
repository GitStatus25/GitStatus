const User = require('../models/User');
const Plan = require('../models/Plan');
const { UsageAnalyticsService } = require('../services/UsageStats');

/**
 * Admin controller for user management and analytics
 */
class AdminController {
  /**
   * Get all users (admin only)
   */
  static async getUsers(req, res) {
    try {
      const users = await User.find({}, { accessToken: 0 }).populate('plan'); // Exclude access token, include plan details
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
   * Update user plan (admin only)
   */
  static async updateUserPlan(req, res) {
    try {
      const { planId } = req.body;
      
      // Verify plan exists
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { plan: planId },
        { new: true, select: '-accessToken' }
      ).populate('plan');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user plan', error: error.message });
    }
  }

  /**
   * Get admin analytics (admin only)
   */
  static async getAnalytics(req, res) {
    try {
      const analytics = await UsageAnalyticsService.getAdminAnalytics();
      const data = {
        ...analytics
      };
      console.log('Data:', data);
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
  }

  /**
   * Get all plans (admin only)
   */
  static async getPlans(req, res) {
    try {
      const plans = await Plan.find({});
      res.json({ plans });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching plans', error: error.message });
    }
  }

  /**
   * Create a new plan (admin only)
   */
  static async createPlan(req, res) {
    try {
      const { name, rateLimit, price, features } = req.body;
      
      // Validate required fields
      if (!name || !rateLimit || !price) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          details: 'Plan name, rate limit, and price are required'
        });
      }
      
      // Check if plan with name already exists
      const existingPlan = await Plan.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingPlan) {
        return res.status(400).json({ message: 'Plan with this name already exists' });
      }
      
      // Create plan
      const plan = await Plan.create({
        name,
        rateLimit,
        price,
        features,
        limits: {
          reportsPerMonth: parseInt(rateLimit, 10) || 100,
          commitsPerMonth: parseInt(rateLimit, 10) * 10 || 1000,
          tokensPerMonth: parseInt(rateLimit, 10) * 100 || 10000
        }
      });
      
      res.status(201).json({ plan });
    } catch (error) {
      res.status(500).json({ message: 'Error creating plan', error: error.message });
    }
  }

  /**
   * Update an existing plan (admin only)
   */
  static async updatePlan(req, res) {
    try {
      const { name, rateLimit, price, features } = req.body;
      
      // Find plan
      const plan = await Plan.findById(req.params.planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Check if plan name is being changed and if new name already exists
      if (name && name !== plan.name) {
        const existingPlan = await Plan.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: plan._id }
        });
        
        if (existingPlan) {
          return res.status(400).json({ message: 'Another plan with this name already exists' });
        }
      }
      
      // Update plan
      const updatedPlan = await Plan.findByIdAndUpdate(
        req.params.planId,
        {
          name: name || plan.name,
          rateLimit: rateLimit || plan.rateLimit,
          price: price || plan.price,
          features: features || plan.features,
          ...(rateLimit && {
            limits: {
              reportsPerMonth: parseInt(rateLimit, 10) || 100,
              commitsPerMonth: parseInt(rateLimit, 10) * 10 || 1000,
              tokensPerMonth: parseInt(rateLimit, 10) * 100 || 10000
            }
          })
        },
        { new: true }
      );
      
      res.json({ plan: updatedPlan });
    } catch (error) {
      res.status(500).json({ message: 'Error updating plan', error: error.message });
    }
  }
}

module.exports = AdminController; 