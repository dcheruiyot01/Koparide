const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const protect = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit');

/**
 * GET /auth/me
 */
router.get('/me', protect, (req, res) => {
  const { id, name, email, createdAt } = req.user;

  return res.json({
    user: { id, name, email, createdAt }
  });
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/logout', authController.logout);

module.exports = router;
