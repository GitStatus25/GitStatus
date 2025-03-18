const mongoose = require('mongoose');
const User = require('../models/User');
const PlanService = require('../services/planService');

async function migrateUserPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus');
    console.log('Connected to MongoDB');

    // Get default plan
    const defaultPlan = await PlanService.getDefaultPlan();
    console.log('Found default plan:', defaultPlan.name);

    // Find users without a plan
    const usersWithoutPlan = await User.find({ plan: { $exists: false } });
    console.log(`Found ${usersWithoutPlan.length} users without a plan`);

    // Update users without a plan
    const result = await User.updateMany(
      { plan: { $exists: false } },
      { 
        $set: { 
          plan: defaultPlan._id,
          currentUsage: {
            reportsGenerated: 0,
            commitsAnalyzed: 0,
            tokensUsed: 0,
            lastResetDate: new Date()
          }
        }
      }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} users.`);

    // Verify the migration
    const remainingUsersWithoutPlan = await User.find({ plan: { $exists: false } });
    console.log(`Remaining users without plan: ${remainingUsersWithoutPlan.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUserPlans(); 