const mongoose = require('mongoose');

/**
 * CommitSummary model schema
 * Used to cache OpenAI-generated summaries for commits
 */
const commitSummarySchema = new mongoose.Schema({
  // Unique identifier for the commit
  commitId: {
    type: String,
    required: true,
    index: true
  },
  
  // Repository this commit belongs to
  repository: {
    type: String,
    required: true,
    index: true
  },
  
  // The commit message
  message: {
    type: String,
    required: true
  },
  
  // Author of the commit
  author: {
    type: String,
    required: true
  },
  
  // Date of the commit
  date: {
    type: Date,
    required: true
  },
  
  // OpenAI-generated summary
  summary: {
    type: String,
    required: true
  },
  
  // Files changed in this commit
  filesChanged: {
    type: Number,
    default: 0
  },
  
  // Tracking when this summary was last accessed
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  
  // Tracking when this summary was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on repository and commitId for faster lookups
commitSummarySchema.index({ repository: 1, commitId: 1 }, { unique: true });

module.exports = mongoose.model('CommitSummary', commitSummarySchema);
