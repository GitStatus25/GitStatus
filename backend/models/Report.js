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
  pdfUrl: {
    type: String,
    required: true
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

module.exports = mongoose.model('Report', ReportSchema);
