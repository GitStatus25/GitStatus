/**
 * Utility functions for usage statistics services
 */
class UsageStatsUtil {
  /**
   * Get the current month in YYYY-MM format
   * @returns {string} Current month in YYYY-MM format
   */
  static getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

module.exports = UsageStatsUtil; 