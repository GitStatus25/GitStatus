require('dotenv').config();
const mongoose = require('mongoose');
const UsageStats = require('../models/UsageStats');

const migrateUsageStats = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all usage stats records
    const stats = await UsageStats.find({});
    console.log(`Found ${stats.length} usage stats records to migrate`);

    // Update each record
    for (const stat of stats) {
      // Skip if already migrated (has reports.small)
      if (stat.reports.small !== undefined) {
        continue;
      }

      // Convert old structure to new structure
      const oldReportsCount = stat.reports || 0;
      const oldCommitsCount = stat.commits || 0;

      // Estimate small/big reports based on commits
      // If commits > 10, consider it a big report
      const bigReports = Math.floor(oldCommitsCount / 10);
      const smallReports = Math.max(0, oldReportsCount - bigReports);

      // Update the record
      stat.reports = {
        small: smallReports,
        big: bigReports
      };

      stat.commits = {
        small: Math.max(0, oldCommitsCount - (bigReports * 10)),
        big: bigReports * 10
      };

      await stat.save();
      console.log(`Migrated record for user ${stat.user} in month ${stat.month}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsageStats(); 