const mongoose = require('mongoose');
const UsageStats = require('./UsageStats');

const UserSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  plan: {
    type: String,
    default: 'free',
    lowercase: true
  }
});

// Method to check if user has exceeded their monthly limits
UserSchema.methods.hasExceededLimits = async function(type, amount = 1) {
  // Get user plan details
  const Plan = mongoose.model('Plan');
  const userPlan = await Plan.findOne({ name: { $regex: new RegExp(`^${this.plan}$`, 'i') } });
  
  if (!userPlan) {
    // If no plan found, use the free plan limits as fallback
    const freePlan = await Plan.findOne({ name: 'free' });
    if (!freePlan) {
      throw new Error('No plan defined in system');
    }
    
    this.plan = 'free';
    await this.save();
    return this.hasExceededLimits(type, amount);
  }
  
  // Get current month's stats
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentMonthStats = await UsageStats.findOne({
    user: this._id,
    month: currentMonth
  });

  // If no stats for this month, user hasn't reached limit
  if (!currentMonthStats) return false;

  switch (type) {
    case 'reports':
      const totalReports = (currentMonthStats.reports.standard || 0) + 
                          (currentMonthStats.reports.large || 0);
      return (totalReports + amount) > userPlan.limits.reportsPerMonth;
    case 'commits':
      return (currentMonthStats.commits.total + amount) > userPlan.limits.commitsPerMonth;
    case 'tokens':
      return (currentMonthStats.tokenUsage.total + amount) > userPlan.limits.tokensPerMonth;
    default:
      throw new Error('Invalid limit type');
  }
};

// Method to increment usage
UserSchema.methods.incrementUsage = async function(type, amount = 1, reportType = 'standard') {
  if (await this.hasExceededLimits(type, amount)) {
    throw new Error(`Monthly ${type} limit exceeded`);
  }

  switch (type) {
    case 'reports':
      this.currentUsage.reportsGenerated[reportType] += amount;
      break;
    case 'commits':
      this.currentUsage.commitsAnalyzed += amount;
      break;
    case 'tokens':
      this.currentUsage.tokensUsed += amount;
      break;
    default:
      throw new Error('Invalid usage type');
  }

  return this.save();
};

module.exports = mongoose.model('User', UserSchema);
