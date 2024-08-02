require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const stripe = require('stripe')("sk_test_51PYVhBCakG4dId7vbuiX5Fa7Nk2jdLcK6rl80F67AcPVQUAQ4ZesuLC8SfN36C1u3QVll4Dk1QnJXJCqu37UCZff00NAE2Itr4");
const bodyParser = require('body-parser');
const User = require('./models/User');

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

// Route to get user subscription status
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      subscribed: user.subscribed,
      imageGenerationCount: user.imageGenerationCount || 0
    });
  } catch (error) {
    console.error('Error fetching user subscription status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Routes
const predictionsRouter = require('./routes/predictions');
app.use('/api/predictions', predictionsRouter);

// Stripe Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
  const { userId, productId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1PYViGCakG4dId7vDIopCcx4',
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      customer_email: email,
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.metadata.userId;
    const userEmail = session.customer_email;

    try {
      const updatedUser = await User.findOneAndUpdate(
        { clerkUserId: userId },
        { subscribed: true, email: userEmail },
        { new: true }
      );

      if (!updatedUser) {
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

  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});