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
    standard: {
      type: Number,
      default: 0
    },
    large: {
      type: Number,
      default: 0
    }
  },
  
  // Commit analysis metrics
  commits: {
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Token usage tracking for AI services
  tokenUsage: {
    // Total tokens (input + output)
    total: {
      type: Number,
      default: 0
    },
    // Input tokens (prompts)
    input: {
      type: Number,
      default: 0
    },
    // Output tokens (completions)
    output: {
      type: Number,
      default: 0
    },
    // Breakdown by model/service for total tokens
    byModel: {
      type: Map,
      of: Number,
      default: () => ({})
    },
    // Breakdown by model/service for input tokens
    inputByModel: {
      type: Map,
      of: Number,
      default: () => ({})
    },
    // Breakdown by model/service for output tokens
    outputByModel: {
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
    // Input token costs
    input: {
      type: Number,
      default: 0
    },
    // Output token costs 
    output: {
      type: Number,
      default: 0
    },
    // Breakdown by service type
    byService: {
      type: Map,
      of: Number,
      default: () => ({})
    },
    // Breakdown by service for input costs
    inputByService: {
      type: Map,
      of: Number,
      default: () => ({})
    },
    // Breakdown by service for output costs
    outputByService: {
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