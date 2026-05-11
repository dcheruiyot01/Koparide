/**
 * Authentication Controller
 *
 * This controller:
 * - Delegates business logic to AuthService
 * - Handles HTTP-only cookie management for refresh tokens
 * - Returns consistent JSON responses
 */

const AuthService = require('../services/auth.service');

// Optional: add a simple logger if you don't have one
const logger = console; // or require('../utils/logger');

module.exports = {

  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json({
        message: 'User registered successfully',
        ...result
      });
    } catch (err) {
      logger.error('Registration error:', err);
      next(err);
    }
  },

  /**
   * Login user
   * - Issues access token (JSON)
   * - Issues refresh token (HTTP-only cookie)
   */
  async login(req, res, next) {
    try {
      const { accessToken, refreshToken, user } = await AuthService.login(req.body);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        message: "Login successful",
        token: accessToken,
        user
      });
    } catch (err) {
      logger.error('Login error:', err.message, err.stack);

      // Use the status and message from the service error (if present)
      const statusCode = err.status || 500;
      const message = err.message || 'Invalid email or password';

      const error = new Error(message);
      error.statusCode = statusCode;
      next(error);
    }
  },

  async googleOAuth(req, res, next) {
    try {
      const { credential } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.googleOAuth(credential);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        message: 'Google login successful',
        token: accessToken,
        user
      });
    } catch (err) {
      logger.error('Google OAuth error:', err);
      next(err);
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(req, res, next) {
    try {
      const result = await AuthService.createPasswordResetToken(req.body.email);
      return res.status(200).json({
        message: 'Password reset link generated',
        ...result
      });
    } catch (err) {
      logger.error('Forgot password error:', err);
      next(err);
    }
  },

  /**
   * Reset password
   */
  async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      return res.status(200).json(result);
    } catch (err) {
      logger.error('Reset password error:', err);
      next(err);
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      const result = await AuthService.verifyEmail(token);
      return res.status(200).json(result);
    } catch (err) {
      logger.error('Email verification error:', err);
      next(err);
    }
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationEmail(email);
      return res.status(200).json(result);
    } catch (err) {
      logger.error('Resend verification error:', err);
      next(err);
    }
  },

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const result = await AuthService.refresh(refreshToken);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        token: result.accessToken
      });
    } catch (err) {
      logger.error('Refresh token error:', err);
      next(err);
    }
  },

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      await AuthService.logout(req.user);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(200).json({
        message: 'Logged out successfully'
      });
    } catch (err) {
      logger.error('Logout error:', err);
      next(err);
    }
  }

};