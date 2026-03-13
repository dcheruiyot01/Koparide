/**
 * Authentication Controller
 *
 * This controller:
 * - Delegates business logic to AuthService
 * - Handles HTTP-only cookie management for refresh tokens
 * - Returns consistent JSON responses
 */

const AuthService = require('../services/auth.service');

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
      next(err);
    }
  },

  /**
   * Login user
   * - Issues access token (JSON)
   * - Issues refresh token (HTTP-only cookie)
   */
  // controllers/auth.controller.js
  async login(req, res, next) {
    try {
      // AuthService.login should validate credentials and return tokens + user
      const { accessToken, refreshToken, user } = await AuthService.login(req.body);

      // Set refresh token as secure, httpOnly cookie (browser can't access it directly)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only secure in production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      // Return access token + user in response body
      return res.status(200).json({
        message: "Login successful",
        token: accessToken,
        user
      });
    } catch (err) {
      next(err);
    }
  },

  async googleOAuth(req, res, next) {
    try {
      const { credential } = req.body; // Google ID token from frontend

      const { user, accessToken, refreshToken } =
          await AuthService.googleOAuth(credential);

      // Set refresh token cookie
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
      next(err);
    }
  },

  /**
   * Refresh access token
   * - Reads refresh token from cookie
   * - Validates it via AuthService
   * - Returns new access token
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const newAccessToken = await AuthService.refresh(refreshToken);

      return res.status(200).json({
        token: newAccessToken
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Logout user
   * - Revokes refresh token in DB
   * - Clears refresh token cookie
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
      next(err);
    }
  }

};
