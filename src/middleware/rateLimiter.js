const rateLimit = require('express-rate-limit');

// Progressive Rate Limiting untuk Login
// Attempt 1-2: langsung
// Attempt 3: 30 detik
// Attempt 4: 2 menit  
// Attempt 5+: 5 menit

class ProgressiveRateLimit {
  constructor() {
    this.attempts = new Map(); // Store IP attempts with timestamps
  }

  getWaitTime(attemptCount) {
    if (attemptCount <= 8) return 0; // No wait for first 8 attempts (very relaxed for quick switching)
    if (attemptCount === 9) return 5 * 1000; // 5 seconds
    if (attemptCount === 10) return 15 * 1000; // 15 seconds
    return 30 * 1000; // 30 seconds for 11+ attempts
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Get or create attempt record for this IP
      if (!this.attempts.has(ip)) {
        this.attempts.set(ip, { count: 0, lastAttempt: now, blockedUntil: 0 });
      }
      
      const record = this.attempts.get(ip);
      
      // Check if still in cooldown period
      if (now < record.blockedUntil) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 1000);
        return res.status(429).json({
          error: `Too many login attempts. Please wait ${remainingTime} seconds before trying again.`,
          retryAfter: remainingTime
        });
      }
      
      // Reset attempts if last attempt was more than 15 minutes ago
      if (now - record.lastAttempt > 15 * 60 * 1000) {
        record.count = 0;
      }
      
      // Increment attempt count
      record.count++;
      record.lastAttempt = now;
      
      // Set block time based on attempt count
      const waitTime = this.getWaitTime(record.count);
      if (waitTime > 0) {
        record.blockedUntil = now + waitTime;
      }
      
      // Add attempt info to request for logging
      req.loginAttempt = {
        ip,
        count: record.count,
        waitTime: waitTime / 1000 // in seconds
      };
      
      next();
    };
  }

  // Method to reset attempts for an IP (useful after successful login)
  resetAttempts(ip) {
    if (this.attempts.has(ip)) {
      this.attempts.set(ip, { count: 0, lastAttempt: Date.now(), blockedUntil: 0 });
    }
  }
}

// Create singleton instance
const progressiveRateLimit = new ProgressiveRateLimit();

// Standard rate limiter for other endpoints
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  progressiveRateLimit: progressiveRateLimit.middleware(),
  resetLoginAttempts: (ip) => progressiveRateLimit.resetAttempts(ip),
  standardRateLimit
};
