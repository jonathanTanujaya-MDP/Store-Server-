// Production-ready app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware for production
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {} : false,
  crossOriginEmbedderPolicy: false
}));

app.set('trust proxy', 1);

// Production-ready CORS configuration
const corsOptions = {
  origin: [
    'https://store-omega-livid.vercel.app',
    'https://*.vercel.app',
    'https://vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Manajemen Stok API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Health check for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const validAccounts = {
    admin: process.env.ADMIN_PASSWORD || 'password',
    owner: process.env.OWNER_PASSWORD || 'password'
  };
  
  if (validAccounts[username] && validAccounts[username] === password) {
    const token = Buffer.from(JSON.stringify({
      username,
      role: username,
      loginTime: new Date().toISOString(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');
    
    const userData = {
      username,
      role: username,
      loginTime: new Date().toISOString()
    };

    console.log(`✅ Login successful: ${username} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } else {
    console.log(`❌ Login failed: ${username} at ${new Date().toISOString()}`);
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token expired
    if (decoded.exp && Date.now() > decoded.exp) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Products endpoint
app.get('/api/products', authenticate, (req, res) => {
  const sampleProducts = [
    {
      id: 1,
      name: 'Laptop Gaming ASUS ROG',
      category: 'Electronics',
      selling_price: 15000000,
      stock_quantity: 5,
      minimum_stock: 3
    },
    {
      id: 2,
      name: 'Mouse Logitech MX Master',
      category: 'Electronics', 
      selling_price: 1200000,
      stock_quantity: 15,
      minimum_stock: 10
    },
    {
      id: 3,
      name: 'Keyboard Mechanical Cherry MX',
      category: 'Electronics',
      selling_price: 2500000,
      stock_quantity: 2,
      minimum_stock: 5
    },
    {
      id: 4,
      name: 'Monitor 4K Dell',
      category: 'Electronics',
      selling_price: 8000000,
      stock_quantity: 8,
      minimum_stock: 3
    }
  ];

  // Add purchase_price only for owner
  if (req.user.role === 'owner') {
    sampleProducts.forEach(product => {
      product.purchase_price = Math.floor(product.selling_price * 0.75); // 25% markup
    });
  }

  res.json({
    products: sampleProducts,
    userRole: req.user.role,
    canSeePurchasePrice: req.user.role === 'owner'
  });
});

// Transactions endpoint
app.get('/api/transactions', authenticate, (req, res) => {
  const transactions = [
    {
      id: 1,
      transaction_id: 'TXN-001',
      transaction_type: 'sales',
      customer_name: 'Ahmad Rizky Pratama',
      total_amount: 15000000,
      total_profit: req.user.role === 'owner' ? 3750000 : undefined,
      transaction_date: new Date().toISOString()
    },
    {
      id: 2,
      transaction_id: 'TXN-002',
      transaction_type: 'sales', 
      customer_name: 'Siti Nurhaliza',
      total_amount: 3700000,
      total_profit: req.user.role === 'owner' ? 925000 : undefined,
      transaction_date: new Date(Date.now() - 24*60*60*1000).toISOString()
    },
    {
      id: 3,
      transaction_id: 'RST-001',
      transaction_type: 'restock',
      customer_name: 'Supplier Electronics Inc',
      total_amount: 25000000,
      total_profit: req.user.role === 'owner' ? 0 : undefined,
      transaction_date: new Date(Date.now() - 48*60*60*1000).toISOString()
    }
  ];

  res.json(transactions);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'POST /api/auth/login',
      'GET /api/products (requires auth)',
      'GET /api/transactions (requires auth)',
      'GET /api/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = app;
