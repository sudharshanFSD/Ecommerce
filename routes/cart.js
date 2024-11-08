const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authToken = require('../middleware/authToken');

// Add product to cart or update quantity if it already exists
router.post('/cart', authToken, async (req, res) => {
    const { productId, quantity, size, color } = req.body;

    // Validate that size and color are provided
    if (!size || !color) {
        return res.status(400).json({ message: 'Size and color are required' });
    }

    try {
        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find the user's cart or create a new one
        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId, products: [] });
        }

        // Check if the product with the same size and color already exists in the cart
        const existingProductIndex = cart.products.findIndex(p => 
            p.product.toString() === productId && p.size === size && p.color === color
        );

        if (existingProductIndex > -1) {
            // If it exists, update the quantity and recalculate price
            cart.products[existingProductIndex].quantity = quantity;

            // Recalculate the total price for the product
            const updatedPrice = product.price * quantity;

            // Update the total price for the product in the cart
            cart.products[existingProductIndex].totalPrice = updatedPrice;
        } else {
            // Otherwise, add the product with the provided size and color
            const newProduct = {
                product: productId,
                quantity,
                size,
                color,
                totalPrice: product.price * quantity // Initial price based on quantity
            };
            cart.products.push(newProduct);
        }

        await cart.save();
        res.status(200).json({ message: 'Product added/updated in cart', cart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get cart for user
router.get('/cart', authToken, async (req, res) => {
    try {
        // Find the user's cart and populate product details
        const cart = await Cart.findOne({ user: req.user.userId }).populate('products.product');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.json(cart);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove a product from cart by size and color
router.delete('/cart/:productId', authToken, async (req, res) => {
    const { productId } = req.params;
    const { size, color } = req.body;

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Filter out the product with the specific size and color
        cart.products = cart.products.filter(p => 
            !(p.product.toString() === productId && p.size === size && p.color === color)
        );

        await cart.save();
        res.status(200).json({ message: 'Product removed from cart', cart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
