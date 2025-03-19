const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

async function migrateReportUsage() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users where reportsGenerated is a number
    const users = await User.find({
      'currentUsage.reportsGenerated': { $type: 'number' }
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      const oldCount = user.currentUsage.reportsGenerated;
      
      // Convert the old number to standard reports
      user.currentUsage.reportsGenerated = {
        standard: oldCount,
        large: 0
      };

      await user.save();
      console.log(`Migrated user ${user.githubId}: ${oldCount} reports -> standard: ${oldCount}, large: 0`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateReportUsage(); 