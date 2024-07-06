// routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import User model

// GET user subscription status
router.get('/:clerkUserId', async (req, res) => {
    const { clerkUserId } = req.params;

    try {
        // Find user by Clerk user ID in MongoDB
        const user = await User.findOne({ clerkUserId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return user subscription status
        res.json({ subscribed: user.subscribed });
    } catch (error) {
        console.error('Error fetching user subscription status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
