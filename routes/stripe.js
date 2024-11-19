const express = require('express');
const router = express.Router();
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authToken = require('../middleware/authToken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');  // Ensure this is imported to access product data

router.post('/create-checkout-session', authToken, async (req, res) => {
    try {
        // Fetch the cart for the logged-in user
        const cart = await Cart.findOne({ user: req.user.userId }).populate('products.product');

    

        // If cart is empty or doesn't have products
        if (!cart || !cart.products || cart.products.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Process the products and prepare line items for Stripe
        const lineItems = await Promise.all(cart.products.map(async (item) => {
            const product = item.product;  // Fetch the product from populated data
            
            // Ensure the product has valid data before proceeding
            if (!product || !product.price || !product.title) {
                throw new Error(`Invalid product data: ${JSON.stringify(product)}`);
            }

            // Log item details for debugging
            console.log(`Processing item ${product.title} with quantity ${item.quantity}`);

            // Prepare the line item for Stripe checkout session
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.title,  // Use product title as name
                        description: product.description,  // Optional: Include description if needed
                        images: product.images,  // Optional: Include image URLs
                    },
                    unit_amount: product.price * 100,  // Convert price to cents
                },
                quantity: item.quantity,  // Ensure this quantity is passed correctly
            };
        }));

       

        // Create the Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,  // Use lineItems without metadata
            mode: 'payment',
            success_url: `http://localhost:5173/CheckoutResult?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/CheckoutResult?status=cancel`,
        });

        // Respond with the URL for the Stripe checkout session
        res.json({ url: session.url });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            message: error instanceof stripe.errors.StripeError ? 'Stripe error' : 'Internal Server Error',
            details: error.message,
        });
    }
});

// In your payment route file (e.g., routes/payment.js)
router.post('/status', authToken, async (req, res) => {
  const { sessionId } = req.body;
  try {
    // Retrieve the Stripe session to check its status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    if (session.payment_status === 'paid') {
      res.json({ status: 'succeeded' });
    } else {
      res.json({ status: 'failed' });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Error checking payment status' });
  }
});

module.exports = router;
