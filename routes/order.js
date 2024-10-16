const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authToken = require('../middleware/authToken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe

// Place an order with Stripe payment
router.post('/order', authToken, async (req, res) => {
    const { paymentMethodId, shippingAddress } = req.body;

    try {
        const cart = await Cart.findOne({ user: req.user.userId }).populate('products.product'); // Use req.user.userId
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

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalPrice * 100, // Amount in cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            }
        });

        const newOrder = new Order({
            user: req.user.userId, // Use req.user.userId
            products,
            totalPrice,
            paymentInfo: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                method: paymentIntent.payment_method
            },
            shippingAddress // This will now be an object
        });

        await newOrder.save();

        // Clear the cart after the order is placed
        await Cart.findOneAndDelete({ user: req.user.userId }); // Use req.user.userId

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });

    } catch (error) {
        console.error(error);
        if (error.type === 'StripeCardError') {
            return res.status(400).json({ message: 'Payment failed', error: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});



// Get all orders for a user
router.get('/order', authToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId }).populate('products.product');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get details of a single order
router.get('/order/:orderId', authToken, async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId).populate('products.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel an order
router.delete('/order/:orderId', authToken, async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If payment was made via Stripe, attempt to refund
        if (order.paymentInfo && order.paymentInfo.id) {
            await stripe.refunds.create({ payment_intent: order.paymentInfo.id });
        }

        await Order.findByIdAndDelete(orderId);

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
