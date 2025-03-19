const Plan = require('../models/Plan');

class PlanService {
  /**
   * Initialize default plan if it doesn't exist
   */
  static async initializeDefaultPlan() {
    try {
      const defaultPlan = await Plan.findOne({ isDefault: true });
      
      if (!defaultPlan) {
        await Plan.create({
          name: 'free',
          displayName: 'Free Plan',
          description: 'Basic GitHub analytics for individual developers',
          limits: {
            reportsPerMonth: 50,
            commitsPerStandardReport: 5,
            commitsPerLargeReport: 20
          },
          isDefault: true
        });
        console.log('Default plan created successfully');
      }
    } catch (error) {
      console.error('Error initializing default plan:', error);
      throw error;
    }
  }

  /**
   * Get default plan
   * @returns {Promise<Object>} Default plan
   */
  static async getDefaultPlan() {
    try {
      const defaultPlan = await Plan.findOne({ isDefault: true });
      if (!defaultPlan) {
        throw new Error('Default plan not found');
      }
      return defaultPlan;
    } catch (error) {
      console.error('Error getting default plan:', error);
      throw error;
    }
  }

  /**
   * Get plan by ID
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Plan
   */
  static async getPlanById(planId) {
    try {
      const plan = await Plan.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }
      return plan;
    } catch (error) {
      console.error('Error getting plan:', error);
      throw error;
    }
  }

  /**
   * Get all plans
   * @returns {Promise<Array>} Array of plans
   */
  static async getAllPlans() {
    try {
      return await Plan.find({});
    } catch (error) {
      console.error('Error getting plans:', error);
      throw error;
    }
  }

  /**
   * Update plan
   * @param {string} planId - Plan ID
   * @param {Object} updates - Plan updates
   * @returns {Promise<Object>} Updated plan
   */
  static async updatePlan(planId, updates) {
    try {
      const plan = await Plan.findByIdAndUpdate(
        planId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!plan) {
        throw new Error('Plan not found');
      }
      
      return plan;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  static async updatePlanLimits(planId, limits) {
    try {
      const plan = await Plan.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      plan.limits = {
        ...plan.limits,
        ...limits
      };

      await plan.save();
      return plan;
    } catch (error) {
      console.error('Error updating plan limits:', error);
      throw error;
    }
  }
}

module.exports = PlanService; 