const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token. Please login again.'
      });
    } else {
      return res.status(500).json({
        error: 'Token verification failed.'
      });
    }
  }
};

// Authorization middleware for owner-only actions
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      error: 'Access denied. Owner privileges required.',
      userRole: req.user.role,
      requiredRole: 'owner'
    });
  }

  next();
};

// Authorization middleware for admin or owner
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({
      error: 'Access denied. Admin or Owner privileges required.',
      userRole: req.user.role,
      requiredRole: ['admin', 'owner']
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireOwner,
  requireAdminOrOwner
};
