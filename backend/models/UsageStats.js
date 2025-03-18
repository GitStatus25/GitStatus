const mongoose = require('mongoose');

/**
 * UsageStats model schema
 * Used to track detailed analytics of system usage
 */
const UsageStatsSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Month this record pertains to (YYYY-MM format)
  month: {
    type: String,
    required: true,
    index: true
  },
  
  // Report generation metrics
  reports: {
    total: {
      type: Number,
      default: 0
    },
    // Breakdown by report types if needed
    byType: {
      type: Map,
      of: Number,
      default: () => ({})
    }
  },
  
  // Commit analysis metrics
  commits: {
    total: {
      type: Number,
      default: 0
    },
    summarized: {
      type: Number,
      default: 0
    }
  },
  
  // Token usage tracking for AI services
  tokenUsage: {
    total: {
      type: Number,
      default: 0
    },
    // Breakdown by model/service
    byModel: {
      type: Map,
      of: Number,
      default: () => ({})
    }
  },
  
  // Estimated cost analysis (in USD)
  costEstimate: {
    total: {
      type: Number,
      default: 0
    },
    // Breakdown by service type
    byService: {
      type: Map,
      of: Number,
      default: () => ({})
    }
  },
  
  // Creation and last update timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on user and month for faster lookups
UsageStatsSchema.index({ user: 1, month: 1 }, { unique: true });

// Set the updatedAt field before saving
UsageStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UsageStats', UsageStatsSchema);