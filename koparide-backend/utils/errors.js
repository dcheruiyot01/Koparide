/**
 * Custom error classes for consistent API error handling.
 * Includes a global error handler middleware for Express.
 */

/**
 * Base application error.
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // distinguish operational from programming errors
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Serialize error for JSON responses.
     * Avoids exposing stack traces in production.
     */
    toJSON() {
        return {
            message: this.message,
            statusCode: this.statusCode,
            ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
        };
    }
}

/**
 * 404 Not Found error.
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * 400 Bad Request error (validation, missing fields, etc.)
 */
class ValidationError extends AppError {
    constructor(message = 'Invalid input') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized error.
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden error.
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * 409 Conflict error (e.g., duplicate entry)
 */
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}

/**
 * Global Express error handler middleware.
 * Use this as the last middleware in your app.
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error(err);

    // If the error is an instance of AppError, use its statusCode and message
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // For unknown errors (programming errors, etc.), send 500
    const internalError = new AppError('Internal server error', 500);
    res.status(500).json(internalError.toJSON());
};

/**
 * Middleware to catch 404 routes (not found).
 * Place after all route definitions but before errorHandler.
 */
const notFoundHandler = (req, res, next) => {
    const err = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
    next(err);
};

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    errorHandler,
    notFoundHandler,
};