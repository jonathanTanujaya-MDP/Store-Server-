const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS for Vercel
app.use(cors({
  origin: [
    'https://store-omega-livid.vercel.app',
    'https://vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Manajemen Stok API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  if ((username === 'admin' && password === 'password') || 
      (username === 'owner' && password === 'password')) {
    
    const token = Buffer.from(JSON.stringify({
      username,
      role: username,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        username,
        role: username
      }
    });
  } else {
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
    if (decoded.exp < Date.now()) {
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
  const products = [
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
      selling_price: 1500000,
      stock_quantity: 15,
      minimum_stock: 10
    },
    {
      id: 3,
      name: 'Keyboard Corsair K95',
      category: 'Electronics',
      selling_price: 2800000,
      stock_quantity: 2,
      minimum_stock: 5
    },
    {
      id: 4,
      name: 'Monitor Samsung 24"',
      category: 'Electronics',
      selling_price: 3500000,
      stock_quantity: 8,
      minimum_stock: 3
    }
  ];

  // Add purchase_price for owner role
  if (req.user.role === 'owner') {
    products.forEach(product => {
      product.purchase_price = Math.floor(product.selling_price * 0.7);
    });
  }

  res.json({
    products,
    userRole: req.user.role
  });
});

// Transactions endpoint
app.get('/api/transactions', authenticate, (req, res) => {
  const transactions = [
    {
      id: 1,
      transaction_id: 'TXN-2025001',
      transaction_type: 'sales',
      customer_name: 'Ahmad Rizky',
      total_amount: 15000000,
      transaction_date: new Date().toISOString()
    },
    {
      id: 2,
      transaction_id: 'TXN-2025002',
      transaction_type: 'sales', 
      customer_name: 'Siti Nurhaliza',
      total_amount: 1500000,
      transaction_date: new Date(Date.now() - 2*60*60*1000).toISOString()
    },
    {
      id: 3,
      transaction_id: 'TXN-2025003',
      transaction_type: 'restock',
      customer_name: 'Supplier Tech',
      total_amount: 10000000,
      transaction_date: new Date(Date.now() - 24*60*60*1000).toISOString()
    }
  ];

  // Add profit info for owner
  if (req.user.role === 'owner') {
    transactions.forEach(tx => {
      if (tx.transaction_type === 'sales') {
        tx.total_profit = Math.floor(tx.total_amount * 0.3); // 30% profit
      } else {
        tx.total_profit = 0;
      }
    });
  }

  res.json(transactions);
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticate, (req, res) => {
  const stats = {
    totalProducts: 4,
    totalTransactions: 3,
    totalRevenue: 26500000,
    lowStockCount: 1
  };

  // Add profit info for owner
  if (req.user.role === 'owner') {
    stats.totalProfit = 7950000;
  }

  res.json(stats);
});

// Stock alerts endpoint
app.get('/api/products/low-stock', authenticate, (req, res) => {
  const lowStockProducts = [
    {
      id: 3,
      name: 'Keyboard Corsair K95',
      stock_quantity: 2,
      minimum_stock: 5,
      difference: -3
    }
  ];

  res.json(lowStockProducts);
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
  });
}

module.exports = app;
