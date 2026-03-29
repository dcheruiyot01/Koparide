/**
 * Custom error classes for consistent API error handling.
 * All errors extend the base AppError and include a statusCode.
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

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
};