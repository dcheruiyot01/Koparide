const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                  // 10 attempts per IP
    message: { message: 'Too many attempts, try again later' }
});
