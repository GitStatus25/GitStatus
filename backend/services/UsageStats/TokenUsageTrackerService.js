const UsageStats = require('../../models/UsageStats');
const UsageStatsUtil = require('./UsageStatsUtil');

/**
 * Service for tracking token usage
 */
class TokenUsageTrackerService {
  /**
   * Track token usage for AI services
   * @param {string} userId - The user ID
   * @param {number} inputTokens - Number of input tokens used
   * @param {number} outputTokens - Number of output tokens used
   * @param {string} model - Model name used
   * @param {number} totalCost - Total cost of the operation
   * @param {number} inputCost - Cost of input tokens
   * @param {number} outputCost - Cost of output tokens
   * @returns {Promise<void>}
   */
  static async trackTokenUsage(userId, inputTokens, outputTokens, model, totalCost, inputCost, outputCost) {
    try {
      const currentMonth = UsageStatsUtil.getCurrentMonth();
      const totalTokens = inputTokens + outputTokens;

      // Update monthly stats only
      const updateQuery = {
        $inc: {
          'tokenUsage.total': totalTokens,
          'tokenUsage.input': inputTokens,
          'tokenUsage.output': outputTokens,
          'costEstimate.total': totalCost,
          'costEstimate.input': inputCost,
          'costEstimate.output': outputCost
        }
      };

      // Add model-specific token usage
      updateQuery.$inc[`tokenUsage.byModel.${model}`] = totalTokens;
      updateQuery.$inc[`tokenUsage.inputByModel.${model}`] = inputTokens;
      updateQuery.$inc[`tokenUsage.outputByModel.${model}`] = outputTokens;

      await UsageStats.findOneAndUpdate(
        { user: userId, month: currentMonth },
        updateQuery,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking token usage:', error);
    }
  }
}

module.exports = TokenUsageTrackerService; 