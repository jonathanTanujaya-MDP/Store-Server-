const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://store-omega-livid.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Simple auth
function authenticate(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No token provided' }));
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (decoded.exp < Date.now()) {
      res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Token expired' }));
      return null;
    }
    
    return decoded;
  } catch (error) {
    res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid token' }));
    return null;
  }
}

// Sample data
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
  }
];

const sampleTransactions = [
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
  }
];

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  console.log(`${method} ${path}`);

  try {
    // Routes
    if (path === '/' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Manajemen Stok API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { username, password } = body;
      
      console.log('Login attempt:', { username, password });
      
      if ((username === 'admin' && password === 'password') || 
          (username === 'owner' && password === 'password')) {
        
        const token = Buffer.from(JSON.stringify({
          username,
          role: username,
          exp: Date.now() + (24 * 60 * 60 * 1000)
        })).toString('base64');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Login successful',
          token,
          user: {
            username,
            role: username
          }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        }));
      }
      return;
    }

    if (path === '/api/products' && method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;
      
      const products = [...sampleProducts];
      
      if (user.role === 'owner') {
        products.forEach(product => {
          product.purchase_price = Math.floor(product.selling_price * 0.7);
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        products,
        userRole: user.role
      }));
      return;
    }

    if (path === '/api/transactions' && method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;
      
      const transactions = [...sampleTransactions];
      
      if (user.role === 'owner') {
        transactions.forEach(tx => {
          if (tx.transaction_type === 'sales') {
            tx.total_profit = Math.floor(tx.total_amount * 0.3);
          } else {
            tx.total_profit = 0;
          }
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transactions));
      return;
    }

    if (path === '/api/dashboard/stats' && method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;
      
      const stats = {
        totalProducts: 3,
        totalTransactions: 2,
        totalRevenue: 16500000,
        lowStockCount: 1
      };
      
      if (user.role === 'owner') {
        stats.totalProfit = 4950000;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    if (path === '/api/products/low-stock' && method === 'GET') {
      const user = authenticate(req, res);
      if (!user) return;
      
      const lowStock = [{
        id: 3,
        name: 'Keyboard Corsair K95',
        stock_quantity: 2,
        minimum_stock: 5,
        difference: -3
      }];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(lowStock));
      return;
    }

    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Endpoint not found',
      path: path
    }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Pure Node.js server running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
  });
}

module.exports = server;
