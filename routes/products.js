const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authToken = require('../middleware/authToken');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const authRole = require('../middleware/authRole')

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/products', authToken,authRole('admin'), upload.array('media'), async (req, res) => {
    
    const { title, description, category, price, stock } = req.body;

    try {
        // Check if files are present
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Upload images to Cloudinary
        const mediaUrls = await Promise.all(req.files.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto' },
                    (error, result) => {
                        if (error) {
                            console.error('Error uploading to Cloudinary:', error);
                            return reject(error);
                        }
                        resolve(result.secure_url);
                    }
                );
                uploadStream.end(file.buffer);
            });
        }));

        // Create new product
        const newProduct = new Product({
            title,
            description,
            category,
            price,
            stock,
            images: mediaUrls.filter(url => url.endsWith('.jpg') || url.endsWith('.png')),
            videos: mediaUrls.filter(url => url.endsWith('.mp4') || url.endsWith('.mov'))
        });

        // Save product to database
        const savedProduct = await newProduct.save();
        res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET a single product by ID
router.get('/products/:productId', async (req, res) => {
    const { productId } = req.params;
    
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE a product by ID with Cloudinary (Protected Route)
router.put('/products/:productId',authToken,authRole('admin'), upload.array('media'), async (req, res) => {
    const { productId } = req.params;
    const { title, description, category, price, stock } = req.body;

    try {
              // Find the package by ID
              const product = await Product.findById(productId);
              if (!product) {
                  return res.status(404).json({ message: 'Product not found' });
              }
      
 // Updating fields if they exist in the request
 if (title) product.title = title;
 if (description) product.description = description;
 if (price) product.price = price;
 if (category) product.category = category;
 if (stock) product.stock = stock;


         // If new media files are provided, replacing the existing ones
         if (req.files && req.files.length > 0) {
            const mediaUrls = await Promise.all(req.files.map(async (file) => {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'auto' },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        });
                    uploadStream.end(file.buffer);
                });
            }));

            // Replacing existing images and videos with new uploads
            product.images = mediaUrls.filter(url => url.endsWith('.jpg') || url.endsWith('.png'));
            product.videos = mediaUrls.filter(url => url.endsWith('.mp4') || url.endsWith('.mov'));
        }
        const updatedProduct = await product.save();

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a product by ID (Protected Route)
router.delete('/products/:productId', authToken,authRole('admin'), async (req, res) => {
    const { productId } = req.params;

    try {
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to get the latest 15 products
router.get('/latest', async (req, res) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .limit(15);              // Limit to the latest 15 products
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Route to get the best-selling products
router.get('/best-selling', async (req, res) => {
    try {
        const bestSellingProducts = await Product.find()
            .sort({ salesCount: -1 }) // Sort by salesCount in descending order
            .limit(4);               // Limit to the top 10 best-selling products
        res.status(200).json(bestSellingProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
