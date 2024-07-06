require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { clerkClient } = require('@clerk/clerk-sdk-node'); // Correct import
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');



const app = express();
const port = process.env.PORT || 5000;

// Initialize Clerk Client
clerkClient.apiKey = process.env.CLERK_SECRET_KEY;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});




// Route to handle Clerk authentication (example)
app.post('/clerk-auth', async (req, res) => {
  const { userId } = req.body; // Assuming Clerk sends userId in the request body

  try {
    // Check if user exists in MongoDB
    let user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      // Create a new user if not found
      user = new User({ clerkUserId: userId });
    }

    // Update subscription status if needed (example: based on a subscription flag sent from frontend)
    const subscribed = req.body.subscribed === true || req.body.subscribed === false;  // Validate as boolean
  user.subscribed = subscribed;

    await user.save();

    // Return user data as needed
    res.json({ user });
  } catch (error) {
    console.error('Error handling Clerk authentication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});









// Routes
const predictionsRouter = require('./routes/predictions');
app.use('/api/predictions', predictionsRouter);

// Stripe Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
        price: 'price_1PYViGCakG4dId7vDIopCcx4', // Replace with your price ID from Stripe Dashboard
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId,
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook handler for Stripe events
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve user ID from session metadata
    const userId = session.metadata.userId;

    try {
      // Update user subscription status in MongoDB
      const user = await User.findOneAndUpdate(
        { clerkUserId: userId },
        { subscribed: true }, // Set user as subscribed
        { new: true }
      );

      if (!user) {
        console.error('User not found for session:', userId);
        return res.status(404).end();
      }

      console.log(`User ${userId} successfully subscribed.`);
      res.json({ received: true });
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});










app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
