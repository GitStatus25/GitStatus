const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  limits: {
    reportsPerMonth: {
      type: Number,
      required: true,
      default: 50
    },
    commitsPerSmallReport: {
      type: Number,
      required: true,
      default: 5
    },
    commitsPerBigReport: {
      type: Number,
      required: true,
      default: 20
    },
    tokensPerMonth: {
      type: Number,
      required: true
    },
    maxReportSize: {
      type: Number,
      required: true
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
planSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Plan', planSchema); 