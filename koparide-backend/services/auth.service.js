/**
 * Auth Service
 *
 * Handles all authentication business logic:
 *  - Register user
 *  - Login user (access + refresh tokens)
 *  - Refresh access token
 *  - Logout (revoke refresh token)
 *  - Email verification
 *  - Password reset
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const User = require('../models/User');
const MailService = require('./mail.service');
const generateResetToken = require('../utils/generateResetToken');

const {
    signAccessToken,
    generateRefreshToken,
    hashToken,
    compareToken
} = require('../utils/token');

/* -------------------------------------------------------
   Utility: Convert user instance to safe public object
-------------------------------------------------------- */
function toSafeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    };
}

module.exports = {

    /* -------------------------------------------------------
       REGISTER
    -------------------------------------------------------- */
    async register({ name, email, password }) {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            const error = new Error('Email already exists');
            error.status = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Email verification token
        const { resetToken, hashedToken } = generateResetToken();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${resetToken}`;
        await MailService.sendVerificationEmail(email, verifyURL);

        return {
            user: toSafeUser(user),
            token: signAccessToken(user.id),
            verifyURL
        };
    },

    /* -------------------------------------------------------
    LOGIN (Access + Refresh Tokens)
 -------------------------------------------------------- */
    async login({ email, password }) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        if (!user.isVerified) {
            const error = new Error('Please verify your email before logging in');
            error.status = 403;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Invalid credentials');
            error.status = 401;
            throw error;
        }

        // Generate access token (THIS WAS MISSING!)
        const accessToken = signAccessToken(user.id);

        // Generate refresh token
        const refreshToken = generateRefreshToken();
        const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

        user.refreshToken = hashedRefresh;
        user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        // Return both tokens
        return {
            user: toSafeUser(user),
            accessToken,      // Now defined!
            refreshToken      // Send plain token, not hashed
        };
    },

    /* -------------------------------------------------------
       GOOGLE OAuth LOGIN
    -------------------------------------------------------- */
    async googleOAuth(idToken) {
        // 1. Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.VITE_GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // 2. Find or create user
        let user = await User.findOne({ where: { googleId } });

        if (!user) {
            // If user exists with same email, link accounts
            const existing = await User.findOne({ where: { email } });

            if (existing) {
                existing.googleId = googleId;
                existing.authProvider = 'google';
                existing.isVerified = true;
                user = await existing.save();
            } else {
                user = await User.create({
                    name,
                    email,
                    googleId,
                    authProvider: 'google',
                    isVerified: true
                });
            }
        }

        // Generate access token (THIS WAS MISSING!)
        const accessToken = signAccessToken(user.id);

        // Generate refresh token
        const refreshToken = generateRefreshToken();
        const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

        user.refreshToken = hashedRefresh;
        user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        // Return both tokens
        return {
            user: toSafeUser(user),
            accessToken,      // Now defined!
            refreshToken      // Send plain token, not hashed
        };
    },

    /* -------------------------------------------------------
   REFRESH ACCESS TOKEN (FIXED VERSION)
-------------------------------------------------------- */
    async refresh(refreshToken) {
        console.log('=== REFRESH DEBUG ===');
        console.log('1. Received refresh token:', refreshToken ? 'Present' : 'Missing');

        if (!refreshToken) {
            const error = new Error('No refresh token provided');
            error.status = 401;
            throw error;
        }

        // Hash the incoming token to compare with stored hashes
        const hashedIncomingToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        console.log('2. Hashed incoming token:', hashedIncomingToken.substring(0, 20) + '...');

        // Find user by the hashed token (direct lookup!)
        const user = await User.findOne({
            where: { refreshToken: hashedIncomingToken }
        });

        console.log('3. User found by token?', !!user);

        if (!user) {
            console.log('4. No user found with that token');
            const error = new Error('Invalid refresh token');
            error.status = 401;
            throw error;
        }

        console.log('5. User ID:', user.id);
        console.log('6. Token expires:', user.refreshTokenExpires);
        console.log('7. Current time:', new Date());

        // Check expiration
        if (user.refreshTokenExpires < Date.now()) {
            console.log('8. Token expired');
            const error = new Error('Refresh token expired');
            error.status = 401;
            throw error;
        }

        console.log('9. Token valid, issuing new access token');

        // Optional: Rotate refresh token (security best practice)
        const newRefreshToken = generateRefreshToken(); // Use the imported function

        const hashedNewRefresh = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

        user.refreshToken = hashedNewRefresh;
        user.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await user.save();

        console.log('10. Refresh token rotated');

        // Return both tokens
        return {
            accessToken: signAccessToken(user.id),
            refreshToken: newRefreshToken // Send new refresh token to client
        };
    },

    /* -------------------------------------------------------
       LOGOUT (Revoke Refresh Token)
    -------------------------------------------------------- */
    async logout(user) {
        if (user) {
            user.refreshToken = null;
            user.refreshTokenExpires = null;
            await user.save();
        }

        return { message: 'Logged out successfully' };
    },

    /* -------------------------------------------------------
       PASSWORD RESET FLOW
    -------------------------------------------------------- */
    async createPasswordResetToken(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        const { resetToken, hashedToken } = generateResetToken();

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await MailService.sendPasswordResetEmail(email, resetURL);

        return { resetURL };
    },

    async resetPassword(token, newPassword) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            const error = new Error('Token is invalid or expired');
            error.status = 400;
            throw error;
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await user.save();

        return { message: 'Password reset successful' };
    },

    /* -------------------------------------------------------
       EMAIL VERIFICATION
    -------------------------------------------------------- */
    async verifyEmail(token) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                emailVerificationToken: hashedToken,
                emailVerificationExpires: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            const error = new Error('Verification token is invalid or expired');
            error.status = 400;
            throw error;
        }

        user.isVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;

        await user.save();

        return { message: 'Email verified successfully' };
    },

    async resendVerificationEmail(email) {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        if (user.isVerified) {
            const error = new Error('Email already verified');
            error.status = 400;
            throw error;
        }

        const { resetToken, hashedToken } = generateResetToken();

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${resetToken}`;
        await MailService.sendVerificationEmail(email, verifyURL);

        return { message: 'Verification email resent', verifyURL };
    }

};