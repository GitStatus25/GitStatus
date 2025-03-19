require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { doubleCsrf } = require('csrf-csrf');
const { selectiveCsrfProtection } = require('./middleware/csrfMiddleware');
const authRoutes = require('./routes/AuthRoutes');
const commitRoutes = require('./routes/CommitsRoutes');
const reportRoutes = require('./routes/ReportsRoutes');
const usageStatsRoutes = require('./routes/UsageStatsRoutes');
const adminRoutes = require('./routes/AdminRoutes');
const planRoutes = require('./routes/PlanRoutes');
const commitSummaryRoutes = require('./routes/CommitSummaryRoutes');
const PlanService = require('./services/planService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services that need to be started with the app
(async () => {
  try {
    // Initialize default plan
    await PlanService.initializeDefaultPlan();
    console.log('Plan initialization complete');
    
    // Run scheduled queue cleanup (once a day)
    const queueService = require('./services/queue');
    setInterval(async () => {
      try {
        await queueService.cleanupJobs();
        console.log('Queue cleanup completed');
      } catch (error) {
        console.error('Error during queue cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // Once a day
    
    console.log('Queue service initialized');
  } catch (error) {
    console.error('Error initializing services:', error);
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

// Apply input sanitization to all requests
const { sanitizeRequest } = require('./middleware/sanitizationMiddleware');
app.use(sanitizeRequest);

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

// CSRF Protection setup
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'gitstatus-csrf-secret',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  },
  size: 64, // token size in bytes
});

// Create middleware that only applies CSRF protection to state-changing methods
const csrfProtection = selectiveCsrfProtection(doubleCsrfProtection);

// Endpoint to get CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Apply CSRF protection to all API routes that might have state-changing operations
app.use('/api/auth', csrfProtection, authRoutes);
app.use('/api/commits', csrfProtection, commitRoutes);
app.use('/api/reports', csrfProtection, reportRoutes);
app.use('/api/usage-stats', csrfProtection, usageStatsRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);
app.use('/api/plans', csrfProtection, planRoutes);
app.use('/api/commit-summary', csrfProtection, commitSummaryRoutes);

// Routes without CSRF protection (read-only operations, OAuth flow)
app.use('/api/auth', authRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/usage-stats', usageStatsRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to GitStatus API' });
});

// Handle 404 for routes that don't exist
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
