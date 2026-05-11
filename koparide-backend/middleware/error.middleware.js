/**
 * Centralized error handler
 * Any error passed to next(err) will end up here.
 * Works with AppError classes (statusCode) and legacy errors (status).
 */
module.exports = (err, req, res, next) => {
 if (process.env.NODE_ENV !== 'test') {
  console.error(err);
 }

 // Determine status: prefer statusCode (from AppError), then status, then 500
 const status = err.statusCode || err.status || 500;
 const message = err.message || 'Server error';

 res.status(status).json({ message });
};

/**
 * Optional 404 handler – call this after all routes.
 * Place it before the error handler.
 */
const notFoundHandler = (req, res, next) => {
 const err = new Error(`Cannot ${req.method} ${req.originalUrl}`);
 err.status = 404;
 next(err);
};

module.exports.notFoundHandler = notFoundHandler;