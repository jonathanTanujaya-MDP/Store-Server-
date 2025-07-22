const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { standardRateLimit } = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for Railway deployment
}));

// Trust proxy (important for Railway deployment)
app.set('trust proxy', 1);

// Rate limiting for all endpoints
app.use(standardRateLimit);

// CORS middleware - Production ready
const corsOptions = {
  origin: [
    'https://store-omega-livid.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Explicit handling for preflight requests
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes - SEPARATED FOR BETTER ORGANIZATION
const authRoutes = require('./routes/auth'); // NEW: Authentication routes
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales'); // NEW: Sales transactions
const restockRoutes = require('./routes/restock'); // NEW: Restock transactions
const transactionsRoutes = require('./routes/transactions'); // Keep for backward compatibility
const reportsRoutes = require('./routes/reports'); // NEW: Reports routes (owner only)

app.use('/api/auth', authRoutes); // NEW: Handle authentication
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes); // NEW: Handle sales transactions
app.use('/api/restock', restockRoutes); // NEW: Handle restock transactions
app.use('/api/transactions', transactionsRoutes); // Keep existing for compatibility
app.use('/api/reports', reportsRoutes); // NEW: Handle reports (sensitive data)

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Manajemen Stok API is running!',
    version: '2.0.0',
    security: 'Enhanced with authentication, rate limiting, and role-based access',
    endpoints: {
      auth: '/api/auth (login, verify)',
      products: '/api/products (protected)',
      sales: '/api/sales (protected)',
      restock: '/api/restock (protected)',
      reports: '/api/reports (owner only)',
      transactions: '/api/transactions (deprecated - use sales/restock)'
    }
  });
});

module.exports = app;
