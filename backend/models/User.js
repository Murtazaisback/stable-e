const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true, // Ensure each user has a unique Clerk ID
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure each user has a unique email address
  },
  subscribed: {
    type: Boolean,
    default: false, // Initialize subscription status as false
  },
  // Add any additional fields you need for your user model
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
