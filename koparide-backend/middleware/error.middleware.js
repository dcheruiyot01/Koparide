/**
 * Centralized error handler
 * Any error passed to next(err) will end up here.
 */
module.exports = (err, req, res, next) => {
 if (process.env.NODE_ENV !== 'test') { 
  console.error(err); 
  }

  // Custom known errors can set status + message
  const status = err.status || 500;
  const message = err.message || 'Server error';

  res.status(status).json({ message });
};
