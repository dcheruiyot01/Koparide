/**
 * JWT Authentication Middleware
 *
 * Verifies the Authorization header, validates the token,
 * loads the associated user, and attaches it to req.user.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Ensure header exists and follows "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided');
      error.status = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Load user from DB
    const user = await User.findByPk(decoded.id);
    if (!user) {
      const error = new Error('Invalid token user');
      error.status = 401;
      throw error;
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (err) {
    // Token errors (expired, malformed, invalid signature)
    if (err.name === 'TokenExpiredError') {
      err.status = 401;
      err.message = 'Token expired';
    } else if (!err.status) {
      err.status = 401;
      err.message = 'Invalid or expired token';
    }

    next(err);
  }
};
