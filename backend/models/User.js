const mongoose = require('mongoose');

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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  }
});

// Method to check if user has exceeded their monthly limits
UserSchema.methods.hasExceededLimits = async function(type, amount = 1) {
  await this.populate('plan');
  
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
      return (totalReports + amount) > this.plan.limits.reportsPerMonth;
    case 'commits':
      return (currentMonthStats.commits.total + amount) > this.plan.limits.commitsPerMonth;
    case 'tokens':
      return (currentMonthStats.tokenUsage.total + amount) > this.plan.limits.tokensPerMonth;
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
