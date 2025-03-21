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
  displayName: {
    type: String,
    required: true,
    unique: false,
    trim: true
  },
  description: {
    type: String,
    required: true,
    unique: false,
    trim: true
  },
  limits: {
    reportsPerMonth: {
      type: Number,
      default: 50
    },
    commitsPerStandardReport: {
      type: Number,
      default: 5
    },
    commitsPerLargeReport: {
      type: Number,
      default: 20
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
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
      const defaultPlan =
        {
          name: 'Free',
          displayName: 'Free Plan',
          description: 'Free plan with limited features',
          limits: {
            reportsPerMonth: 50,
            commitsPerStandardReport: 5,
            commitsPerLargeReport: 20
          },
          isDefault: true
        }

      await this.create(defaultPlan);
      console.log('Default plans created');
    }
  } catch (error) {
    console.error('Error creating default plans:', error);
  }
};

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan; 