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
  },
  currentUsage: {
    reportsGenerated: {
      type: Number,
      default: 0
    },
    commitsAnalyzed: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
});

// Method to check if user has exceeded their monthly limits
UserSchema.methods.hasExceededLimits = async function(type, amount = 1) {
  await this.populate('plan');
  
  // Check if we need to reset usage (new month)
  const lastReset = new Date(this.currentUsage.lastResetDate);
  const now = new Date();
  
  if (lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear()) {
    this.currentUsage = {
      reportsGenerated: 0,
      commitsAnalyzed: 0,
      tokensUsed: 0,
      lastResetDate: now
    };
    await this.save();
    return false;
  }

  switch (type) {
    case 'reports':
      return (this.currentUsage.reportsGenerated + amount) > this.plan.limits.reportsPerMonth;
    case 'commits':
      return (this.currentUsage.commitsAnalyzed + amount) > this.plan.limits.commitsPerMonth;
    case 'tokens':
      return (this.currentUsage.tokensUsed + amount) > this.plan.limits.tokensPerMonth;
    default:
      throw new Error('Invalid limit type');
  }
};

// Method to increment usage
UserSchema.methods.incrementUsage = async function(type, amount = 1) {
  if (await this.hasExceededLimits(type, amount)) {
    throw new Error(`Monthly ${type} limit exceeded`);
  }

  switch (type) {
    case 'reports':
      this.currentUsage.reportsGenerated += amount;
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
