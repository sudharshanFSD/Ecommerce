const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authToken = require('./middleware/authToken'); // Token middleware

// Import Routes
const authRoutes = require('./routes/auth');       
const cartRoutes = require('./routes/cart');        
const orderRoutes = require('./routes/order');     
const productRoutes = require('./routes/products'); 

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(cors());            

// Routes Middleware
app.use('/apiAuth', authRoutes);     
app.use('/apiCart', cartRoutes);     
app.use('/apiOrder', orderRoutes);    
app.use('/apiProduct', productRoutes); 

// Use authentication middleware globally where needed
app.use(authToken); // Ensure routes requiring token have this middleware

// Database and Server connection
mongoose
  .connect(process.env.MONGODB_URI) // Removed useNewUrlParser and useUnifiedTopology
  .then(() => {
    console.log('MongoDB Connected Successfully!!');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.log('Error Occurred: ', err.message);
  });
