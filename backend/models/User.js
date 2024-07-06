const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  clerkUserId: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness of Clerk user ID
  },
  userId: {
    type: String,
    required: true,
  },
  stripeCustomerId: {
    type: String,
  },
  package: {
    type: String,
  },
  status: {
    type: String,
    default: 'Inactive',
  },
}, {
  // Add timestamps for automatic creation and update tracking
  timestamps: true,
});

// Error handling middleware (example)
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Clerk User ID already exists'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
