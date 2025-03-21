const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  repository: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  author: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  commits: [{
    commitId: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    summary: {
      type: String
    }
  }],
  content: {
    type: String,
    default: null
  },
  pdfUrl: {
    type: String,
    default: null
  },
  pdfStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', null],
    default: null
  },
  pdfError: {
    type: String,
    default: null
  },
  pdfJobId: {
    type: String,
    default: null
  },
  reportStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', null],
    default: null
  },
  reportError: {
    type: String,
    default: null
  },
  reportJobId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Hash to identify unique sets of commits
  commitsHash: {
    type: String,
    index: true
  },
  // Track how many times this report has been accessed
  accessCount: {
    type: Number,
    default: 1
  },
  // Track when this report was last accessed
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Add index on user field with createdAt for optimizing queries that filter by user and sort by date
ReportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
