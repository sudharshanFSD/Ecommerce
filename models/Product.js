const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    images: [String],
    videos: [String],
    salesCount: { type: Number, default: 0 }, // New field to track the number of sales
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String },
        rating: { 
            type: Number, 
            min: 1, 
            max: 5 // Enforces a 1-5 star rating system
        },
        createdAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
