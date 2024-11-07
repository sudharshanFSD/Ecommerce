const mongoose = require('mongoose');

const shippingAddressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            size: { type: String },  // Optional size field
            color: { type: String } ,
        }
    ],
    totalPrice: { type: Number, required: true },
    paymentInfo: {
        id: { type: String, required: true },
        status: { type: String, required: true },
        method: { type: String, required: true }
    },
    shippingAddress: { type: shippingAddressSchema, required: true }, // Use the embedded schema here
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
