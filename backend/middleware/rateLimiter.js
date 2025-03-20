const UsageStats = require('../models/UsageStats');
const User = require('../models/User');

const rateLimiter = {
  async checkReportLimit(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate('plan');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyStats = await UsageStats.findOne({
        user: user._id,
        month: currentMonth
      });

      const reportsGenerated = monthlyStats?.reports?.total || 0;
      const limit = user.plan.limits.reportsPerMonth;

      if (reportsGenerated >= limit) {
        return res.status(429).json({
          error: 'Monthly report limit exceeded',
          limit,
          current: reportsGenerated
        });
      }

      next();
    } catch (error) {
      console.error('Error checking report limit:', error);
      res.status(500).json({ error: 'Error checking report limit' });
    }
  },

  async checkCommitLimit(req, res, next) {
    try {
      const user = await User.findById(req.user._id).populate('plan');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { reportType } = req.body; // 'standard' or 'large'
      const commitsPerReport = reportType === 'large' 
        ? user.plan.limits.commitsPerLargeReport 
        : user.plan.limits.commitsPerStandardReport;

      const commitCount = req.body.commits?.length || 0;
      if (commitCount > commitsPerReport) {
        return res.status(429).json({
          error: `Commit limit exceeded for ${reportType} report`,
          limit: commitsPerReport,
          current: commitCount
        });
      }

      // Get the appropriate commit limit based on report type
      const commitLimit = reportType === 'large' 
        ? user.plan.limits.commitsPerLargeReport
        : user.plan.limits.commitsPerStandardReport;

      const commits = req.body.commits || [];
      if (commits.length > commitLimit) {
        return res.status(429).json({
          error: `Report exceeds maximum commits allowed for ${reportType} reports (${commitLimit} commits)`,
          limit: commitLimit,
          type: reportType
        });
      }

      next();
    } catch (error) {
      console.error('Error checking commit limit:', error);
      res.status(500).json({ error: 'Error checking commit limit' });
    }
  }
};

module.exports = rateLimiter; 