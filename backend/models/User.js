const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  usageLimits: {
    reportsPerMonth: {
      type: Number,
      default: 50
    },
    commitsPerMonth: {
      type: Number,
      default: 500
    }
  },
  currentUsage: {
    reportsGenerated: {
      type: Number,
      default: 0
    },
    commitsAnalyzed: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
});

module.exports = mongoose.model('User', UserSchema);
