const Plan = require('../models/Plan');
const PlanService = require('../services/PlanService');

const planController = {
  // Get all plans
  async getPlans(req, res) {
    try {
      const plans = await Plan.find();
      res.json({ plans });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  },

  // Update plan limits
  async updatePlanLimits(req, res) {
    try {
      const { planId } = req.params;
      const { limits } = req.body;

      const updatedPlan = await PlanService.updatePlanLimits(planId, limits);
      res.json({ plan: updatedPlan });
    } catch (error) {
      console.error('Error updating plan limits:', error);
      res.status(500).json({ error: 'Failed to update plan limits' });
    }
  }
};

module.exports = planController; 