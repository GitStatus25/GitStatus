/**
 * Migration script to update UsageStats schema for separate input/output token tracking
 * Run this script with: node scripts/migrateTokenTracking.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const UsageStats = require('../models/UsageStats');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Migrate existing UsageStats records
 * Adds separate input/output token tracking fields while preserving existing data
 */
async function migrateUsageStats() {
  try {
    console.log('Starting migration of UsageStats...');
    
    // Find all existing usage stats records
    const statsRecords = await UsageStats.find({});
    console.log(`Found ${statsRecords.length} usage stats records to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    // For each record, update the schema with estimated input/output splits
    for (const record of statsRecords) {
      try {
        // Check if record already has the new fields
        if (record.tokenUsage.input !== undefined && record.tokenUsage.output !== undefined) {
          console.log(`Record ${record._id} already migrated, skipping...`);
          continue;
        }
        
        // Default to splitting total tokens as 30% input, 70% output if not already set
        // This is a rough estimate based on typical LLM usage patterns
        const totalTokens = record.tokenUsage.total || 0;
        const inputTokens = Math.round(totalTokens * 0.3);  // 30% input tokens
        const outputTokens = totalTokens - inputTokens;     // 70% output tokens
        
        // Default to splitting total cost as 20% input, 80% output if not already set
        // Output tokens typically cost more than input tokens
        const totalCost = record.costEstimate.total || 0;
        const inputCost = totalCost * 0.2;   // 20% input cost
        const outputCost = totalCost * 0.8;  // 80% output cost
        
        // Initialize model breakdown maps if they don't exist
        const inputByModel = {};
        const outputByModel = {};
        const inputByService = {};
        const outputByService = {};
        
        // Split model breakdowns with the same ratio
        if (record.tokenUsage.byModel) {
          for (const [model, tokens] of Object.entries(record.tokenUsage.byModel.toObject() || {})) {
            inputByModel[model] = Math.round(tokens * 0.3);  // 30% input
            outputByModel[model] = Math.round(tokens * 0.7); // 70% output
          }
        }
        
        // Split service cost breakdowns
        if (record.costEstimate.byService) {
          for (const [service, cost] of Object.entries(record.costEstimate.byService.toObject() || {})) {
            inputByService[service] = cost * 0.2;  // 20% input cost
            outputByService[service] = cost * 0.8; // 80% output cost
          }
        }
        
        // Update the record with new fields
        record.tokenUsage.input = inputTokens;
        record.tokenUsage.output = outputTokens;
        record.tokenUsage.inputByModel = inputByModel;
        record.tokenUsage.outputByModel = outputByModel;
        
        record.costEstimate.input = inputCost;
        record.costEstimate.output = outputCost;
        record.costEstimate.inputByService = inputByService;
        record.costEstimate.outputByService = outputByService;
        
        // Save the updated record
        await record.save();
        
        console.log(`Migrated record ${record._id} for user ${record.user} in month ${record.month}`);
        migrated++;
      } catch (recordError) {
        console.error(`Error migrating record ${record._id}:`, recordError);
        errors++;
      }
    }
    
    console.log(`Migration completed: ${migrated} records migrated, ${errors} errors`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateUsageStats(); 