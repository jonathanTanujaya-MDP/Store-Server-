const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { progressiveRateLimit, resetLoginAttempts } = require('../middleware/rateLimiter');
const { validateLogin } = require('../middleware/validation');

// Valid accounts - in production this would be in a database with hashed passwords
const validAccounts = {
  admin: 'password',
  owner: 'password'
};

// Login endpoint with rate limiting and validation
router.post('/login', progressiveRateLimit, validateLogin, (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Check credentials
    if (validAccounts[username] && validAccounts[username] === password) {
      // Create JWT token
      const token = jwt.sign(
        { 
          username,
          role: username, // admin or owner
          loginTime: new Date().toISOString()
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: 'manajemen-stock-api'
        }
      );
      
      const userData = {
        username,
        role: username,
        loginTime: new Date().toISOString()
      };

      // Reset failed attempts on successful login
      resetLoginAttempts(ip);

      // Log successful login
      console.log(`✅ Login successful: ${username} from ${ip} at ${new Date().toISOString()}`);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData
      });
    } else {
      // Log failed attempt
      console.log(`❌ Login failed: ${username} from ${ip} (Attempt #${req.loginAttempt?.count || 'unknown'})`);
      
      res.status(401).json({
        error: 'Invalid username or password',
        attemptCount: req.loginAttempt?.count || 0
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Logout endpoint (optional - mainly for consistency)
router.post('/logout', (req, res) => {
  // In a real app, you might invalidate the token here
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token endpoint (optional - for token validation)
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role,
        loginTime: decoded.loginTime
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    } else {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
  }
});

module.exports = router;
