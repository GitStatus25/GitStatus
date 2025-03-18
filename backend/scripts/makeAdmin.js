const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gitstatus')
  .then(async () => {
    try {
      // Get all users
      const users = await User.find({});
      
      if (users.length === 0) {
        console.log('No users found in the database.');
        process.exit(1);
      }

      // If there's only one user, make them an admin
      if (users.length === 1) {
        const user = users[0];
        user.role = 'admin';
        await user.save();
        console.log(`Made user ${user.username} an admin.`);
      } else {
        console.log('Multiple users found. Please specify which user to make admin:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.username} (${user.name})`);
        });
      }

      process.exit(0);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 