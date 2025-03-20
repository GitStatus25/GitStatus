/**
 * Migration script to convert user plan strings to ObjectId references
 * Run with: node migratePlanReferences.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Plan = require('../models/Plan');
const dbService = require('../services/database/mongoConnection');

async function migratePlanReferences() {
  try {
    // Connect to MongoDB
    await dbService.connect();
    console.log('Connected to MongoDB');

    // Ensure plans exist before migration
    await Plan.createDefaultPlans();
    console.log('Default plans created/verified');

    // Get all plans
    const plans = await Plan.find({});
    console.log(`Found ${plans.length} plans`);

    // Get all users who have string-based plan fields
    const users = await User.find({
      $or: [
        { plan: { $type: 'string' } },
        { plan: { $exists: false } }
      ]
    });
    console.log(`Found ${users.length} users to migrate`);

    // Update each user
    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Find matching plan or default to "Free" plan
        const planName = (user.plan || 'free').toLowerCase();
        const plan = plans.find(p => p.name.toLowerCase() === planName) || 
                    plans.find(p => p.name === 'Free');

        if (!plan) {
          console.error(`No matching plan found for user ${user._id} with plan "${planName}"`);
          errors++;
          continue;
        }

        // Update user plan to reference
        user.plan = plan._id;
        await user.save();
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`Processed ${updated} users so far`);
        }
      } catch (err) {
        console.error(`Error updating user ${user._id}:`, err);
        errors++;
      }
    }

    console.log(`Migration complete. Updated ${updated} users. Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

migratePlanReferences(); 