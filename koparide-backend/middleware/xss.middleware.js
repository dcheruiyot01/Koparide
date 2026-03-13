const xss = require('xss');

/**
 * Recursively sanitize strings in an object/array
 */
function sanitize(obj) {
    if (typeof obj === 'string') {
        return xss(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = sanitize(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

/**
 * XSS Clean Middleware
 * Sanitizes user input in req.body, req.query, and req.params
 */
module.exports = function xssClean(req, res, next) {
    // Sanitize body (plain object after body-parser)
    if (req.body) {
        req.body = sanitize(req.body);
    }

    // Sanitize query (getter – we can modify its properties)
    if (req.query) {
        for (const key in req.query) {
            if (Object.prototype.hasOwnProperty.call(req.query, key)) {
                req.query[key] = sanitize(req.query[key]);
            }
        }
    }

    // Sanitize params (getter – modify properties)
    if (req.params) {
        for (const key in req.params) {
            if (Object.prototype.hasOwnProperty.call(req.params, key)) {
                req.params[key] = sanitize(req.params[key]);
            }
        }
    }

    next();
};