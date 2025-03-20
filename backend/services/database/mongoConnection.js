/**
 * MongoDB Connection Service
 * 
 * A robust service for managing MongoDB connections with:
 * - Connection pooling and configuration
 * - Automatic reconnection with exponential backoff
 * - Event handling for connection state changes
 * - Graceful shutdown handling
 * - Connection health monitoring
 */
const mongoose = require('mongoose');
const EventEmitter = require('events');

class DatabaseService extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.reconnecting = false;
    this.connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000
    };
    
    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.reconnecting = false;
      console.log('✅ MongoDB connected successfully');
      this.emit('connected');
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.log('❌ MongoDB disconnected');
      this.emit('disconnected');
      
      // Attempt to reconnect if not already reconnecting
      if (!this.reconnecting) {
        this.reconnectWithBackoff();
      }
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      this.emit('error', err);
    });
    
    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }
  
  /**
   * Connect to MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) return;
    
    try {
      this.reconnecting = false;
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus', this.connectionOptions);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.emit('error', error);
      this.reconnectWithBackoff();
    }
  }
  
  /**
   * Reconnect to MongoDB with exponential backoff
   * @param {Number} attempt - Current attempt number
   * @param {Number} maxAttempts - Maximum number of attempts
   * @returns {Promise<void>}
   */
  async reconnectWithBackoff(attempt = 1, maxAttempts = 10) {
    if (attempt > maxAttempts) {
      console.error(`Failed to reconnect to MongoDB after ${maxAttempts} attempts`);
      this.emit('reconnectFailed');
      return;
    }
    
    this.reconnecting = true;
    
    // Calculate backoff delay with exponential backoff and jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = delay * 0.2 * Math.random();
    const totalDelay = delay + jitter;
    
    console.log(`Attempting to reconnect to MongoDB in ${Math.round(totalDelay/1000)} seconds (attempt ${attempt}/${maxAttempts})`);
    
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus', this.connectionOptions);
        this.reconnecting = false;
        console.log(`Reconnected to MongoDB on attempt ${attempt}`);
        this.emit('reconnected', attempt);
      } catch (error) {
        console.error(`Failed to reconnect on attempt ${attempt}:`, error);
        this.reconnectWithBackoff(attempt + 1, maxAttempts);
      }
    }, totalDelay);
  }
  
  /**
   * Gracefully shut down the MongoDB connection
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    if (!this.isConnected) return;
    
    try {
      console.log('🛑 Shutting down MongoDB connection...');
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('Error during MongoDB connection shutdown:', error);
      process.exit(1);
    }
  }
  
  /**
   * Check if the connection is healthy and reconnect if needed
   * @returns {Promise<boolean>} - Whether the connection is healthy
   */
  async checkConnection() {
    if (!this.isConnected && !this.reconnecting) {
      console.log('MongoDB connection check failed, attempting to reconnect');
      await this.connect();
      return false;
    }
    return this.isConnected;
  }
}

module.exports = new DatabaseService(); 