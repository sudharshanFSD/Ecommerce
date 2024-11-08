const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your secret key here
const authToken = require('../middleware/authToken');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Route to create PaymentIntent and process the order
router.post('/order', authToken, async (req, res) => {
  const { paymentMethodId, shippingAddress } = req.body;

  try {
    // Validate shipping address
   
    // Fetch cart details for the user
    const cart = await Cart.findOne({ user: req.user.userId }).populate('products.product');
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    let totalPrice = 0;
    const products = cart.products.map(cartItem => {
      totalPrice += cartItem.product.price * cartItem.quantity;
      return {
        product: cartItem.product._id,
        quantity: cartItem.quantity,
        price: cartItem.product.price * cartItem.quantity
      };
    });

    // Create a payment intent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' }, // Disable redirects
    });

    // Create order in the database
    const newOrder = new Order({
      user: req.user.userId,
      products,
      totalPrice,
      paymentInfo: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        method: paymentIntent.payment_method,
      },
      shippingAddress,
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ user: req.user.userId });

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment creation failed' });
  }
});

module.exports = router;
