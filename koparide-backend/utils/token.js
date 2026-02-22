// utils/token.js

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
 * Hash refresh tokens before storing them.
 * Treat refresh tokens like passwords.
 */
exports.hashToken = async (token) => {
    return await bcrypt.hash(token, 10);
};

/**
 * Compare raw refresh token with hashed DB version.
 */
exports.compareToken = async (token, hashed) => {
    return await bcrypt.compare(token, hashed);
};
