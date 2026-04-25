// middleware/admin.middleware.js
const { AppError } = require('../utils/errors');

module.exports = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Not authenticated', 401));
    }
    if (req.user.role !== 'admin') {
        return next(new AppError('Admin access required', 403));
    }
    next();
};