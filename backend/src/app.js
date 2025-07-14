const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - SEPARATED FOR BETTER ORGANIZATION
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales'); // NEW: Sales transactions
const restockRoutes = require('./routes/restock'); // NEW: Restock transactions
const transactionsRoutes = require('./routes/transactions'); // Keep for backward compatibility

app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes); // NEW: Handle sales transactions
app.use('/api/restock', restockRoutes); // NEW: Handle restock transactions
app.use('/api/transactions', transactionsRoutes); // Keep existing for compatibility

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Manajemen Stok API is running!',
    endpoints: {
      products: '/api/products',
      sales: '/api/sales',
      restock: '/api/restock',
      transactions: '/api/transactions (deprecated - use sales/restock)'
    }
  });
});

module.exports = app;
