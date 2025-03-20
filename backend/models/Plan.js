const mongoose = require('mongoose');

/**
 * Plan schema for subscription plans
 */
const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  rateLimit: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  features: {
    type: String,
    trim: true
  },
  limits: {
    reportsPerMonth: {
      type: Number,
      default: 100
    },
    commitsPerMonth: {
      type: Number,
      default: 1000
    },
    tokensPerMonth: {
      type: Number,
      default: 10000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure plan names are unique regardless of case
planSchema.index({ name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

/**
 * Create default plans if none exist
 */
planSchema.statics.createDefaultPlans = async function() {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      const defaultPlans = [
        {
          name: 'Free',
          rateLimit: '100 req/day',
          price: '$0',
          features: 'Basic access',
          limits: {
            reportsPerMonth: 5,
            commitsPerMonth: 100,
            tokensPerMonth: 10000
          }
        },
        {
          name: 'Professional',
          rateLimit: '1000 req/day',
          price: '$10/month',
          features: 'Advanced features',
          limits: {
            reportsPerMonth: 50,
            commitsPerMonth: 1000,
            tokensPerMonth: 100000
          }
        },
        {
          name: 'Enterprise',
          rateLimit: 'Unlimited',
          price: '$99/month',
          features: 'All features',
          limits: {
            reportsPerMonth: 500,
            commitsPerMonth: 10000,
            tokensPerMonth: 1000000
          }
        }
      ];

      await this.insertMany(defaultPlans);
      console.log('Default plans created');
    }
  } catch (error) {
    console.error('Error creating default plans:', error);
  }
};

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan; 