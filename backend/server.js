require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const commitRoutes = require('./routes/commits');
const reportRoutes = require('./routes/reports');
const usageStatsRoutes = require('./routes/usageStats');
const adminRoutes = require('./routes/admin');
const planRoutes = require('./routes/planRoutes');
const PlanService = require('./services/planService');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize default plan
(async () => {
  try {
    await PlanService.initializeDefaultPlan();
    console.log('Plan initialization complete');
  } catch (error) {
    console.error('Error initializing plans:', error);
    process.exit(1);
  }
})();

// Security middlewares
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // TODO: Re-enable proper rate limiting before deployment.
  // Temporarily increased for development to avoid network errors.
  max: 1000, // Increased from 100 to 1000 for development
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
// TODO: For development only - conditionally apply rate limiting
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
} else {
  console.log('Rate limiting disabled for development');
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'gitstatus-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevents client-side JS from reading the cookie
    sameSite: 'lax' // Provides some CSRF protection
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/usage-stats', usageStatsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to GitStatus API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
