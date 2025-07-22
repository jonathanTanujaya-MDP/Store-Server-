const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Trust proxy
app.set('trust proxy', 1);

// Production CORS configuration for Vercel
app.use(cors({
  origin: [
    'https://store-omega-livid.vercel.app',
    'https://*.vercel.app', // Allow all Vercel subdomains
    'https://vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Manajemen Stok API is running!',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Basic auth route for testing
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const validAccounts = {
    admin: 'password',
    owner: 'password'
  };
  
  if (validAccounts[username] && validAccounts[username] === password) {
    // Create a simple token for testing
    const token = Buffer.from(JSON.stringify({
      username,
      role: username,
      loginTime: new Date().toISOString()
    })).toString('base64');
    
    const userData = {
      username,
      role: username,
      loginTime: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Simple auth middleware for testing
const simpleAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Basic products route for testing
app.get('/api/products', simpleAuth, (req, res) => {
  const sampleProducts = [
    {
      id: 1,
      name: 'Laptop Gaming',
      category: 'Electronics',
      selling_price: 15000000,
      stock_quantity: 5,
      minimum_stock: 3
    },
    {
      id: 2,
      name: 'Mouse Wireless',
      category: 'Electronics', 
      selling_price: 150000,
      stock_quantity: 15,
      minimum_stock: 10
    },
    {
      id: 3,
      name: 'Keyboard Mechanical',
      category: 'Electronics',
      selling_price: 800000,
      stock_quantity: 2,
      minimum_stock: 5
    }
  ];

  // Add purchase_price only for owner
  if (req.user.role === 'owner') {
    sampleProducts.forEach(product => {
      product.purchase_price = product.selling_price * 0.7; // 30% markup
    });
  }

  res.json({
    products: sampleProducts,
    userRole: req.user.role,
    canSeePurchasePrice: req.user.role === 'owner'
  });
});

// Basic transactions route for testing
app.get('/api/transactions', simpleAuth, (req, res) => {
  const sampleTransactions = [
    {
      id: 1,
      transaction_id: 'TXN-001',
      transaction_type: 'sales',
      customer_name: 'Ahmad Rizky',
      total_amount: 15000000,
      total_profit: req.user.role === 'owner' ? 4500000 : undefined, // Hide profit from admin
      transaction_date: new Date().toISOString()
    },
    {
      id: 2,
      transaction_id: 'TXN-002', 
      transaction_type: 'restock',
      customer_name: 'Supplier ABC',
      total_amount: 5000000,
      total_profit: req.user.role === 'owner' ? 0 : undefined,
      transaction_date: new Date(Date.now() - 24*60*60*1000).toISOString()
    }
  ];

  res.json(sampleTransactions);
});

module.exports = app;
