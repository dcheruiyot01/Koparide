// utils/token.js

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = '15m'; // Short-lived access token

/**
 * Create a short-lived access token.
 * Access tokens should expire quickly to reduce risk if stolen.
 */
exports.signAccessToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};

/**
 * Create a random refresh token.
 * This is NOT a JWT — it's a random string stored in DB.
 */
exports.generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash refresh tokens for storage using SHA256 (deterministic).
 * This allows us to look up tokens in the database.
 */
exports.hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Compare raw refresh token with hashed DB version.
 * Since we use deterministic SHA256, we just hash and compare.
 */
exports.compareToken = (token, hashed) => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenHash === hashed;
};