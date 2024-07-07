const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as per your project structure

// POST endpoint to store user data
router.post('/api/users', async (req, res) => {
  const { userId, clerkUserId, stripeCustomerId, status } = req.body;

  try {
    // Check if user already exists based on clerkUserId
    let existingUser = await User.findOne({ clerkUserId });

    if (existingUser) {
      // Update existing user's data
      existingUser.userId = userId;
      existingUser.stripeCustomerId = stripeCustomerId;
      existingUser.status = status;
      await existingUser.save();
      res.status(200).json({ message: 'User data updated successfully', user: existingUser });
    } else {
      // Create new user if not found
      const newUser = new User({
        userId,
        clerkUserId,
        stripeCustomerId,
        status,
      });
      await newUser.save();
      res.status(201).json({ message: 'User created successfully', user: newUser });
    }
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
