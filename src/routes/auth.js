const express = require('express');
const router = express.Router();

// Valid accounts - in production this would be in a database with hashed passwords
const validAccounts = {
  admin: 'password',
  owner: 'password'
};

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Check credentials
    if (validAccounts[username] && validAccounts[username] === password) {
      // Simulate JWT token generation
      const token = `jwt-token-${username}-${Date.now()}`;
      
      const userData = {
        username,
        role: username, // admin or owner
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
        error: 'Invalid username or password'
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
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  // Simple token validation (in production use proper JWT verification)
  if (token.startsWith('jwt-token-')) {
    const username = token.split('-')[2];
    if (validAccounts[username]) {
      res.json({
        success: true,
        user: {
          username,
          role: username
        }
      });
    } else {
      res.status(401).json({
        error: 'Invalid token'
      });
    }
  } else {
    res.status(401).json({
      error: 'Invalid token format'
    });
  }
});

module.exports = router;
