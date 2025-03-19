const mongoose = require('mongoose');
const Plan = require('../models/Plan');

async function updateFreePlanLimits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus');
    console.log('Connected to MongoDB');

    // Update the free plan
    const result = await Plan.updateOne(
      { name: 'free' },
      {
        $set: {
          'limits.reportsPerMonth': 50,
          'limits.commitsPerStandardReport': 5,
          'limits.commitsPerLargeReport': 20
        },
        $unset: {
          'limits.tokensPerMonth': "",
          'limits.maxReportSize': ""
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} free plans`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating free plan limits:', error);
    process.exit(1);
  }
}

updateFreePlanLimits(); 