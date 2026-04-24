// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

// ---------- Public Webhook Endpoints (NO auth) ----------
// Must be placed BEFORE router.use(auth)
router.post('/stripe-webhook',
    express.raw({ type: 'application/json' }),
    paymentController.stripeWebhook
);

router.post('/mpesa-callback',
    express.raw({ type: 'application/json' }),
    paymentController.mpesaCallback
);

// ---------- Protected Routes (require authentication) ----------
router.use(auth);   // <-- All routes after this line require a valid token

// Payment validation rules
const paymentValidation = [
    body('method').isIn(['card', 'mpesa']).withMessage('Valid payment method required'),
    body('booking').notEmpty().withMessage('Booking details required'),
    body('booking.carId').isInt().withMessage('Valid car ID required'),
    body('booking.startDate').isISO8601().withMessage('Valid start date required'),
    body('booking.endDate').isISO8601().withMessage('Valid end date required'),
    body('booking.totalAmount').isFloat({ min: 0.01 }).withMessage('Valid total amount required'),
    body('paymentDetails').notEmpty().withMessage('Payment details required'),
];

// Process payment (requires auth)
router.post('/process', paymentValidation, paymentController.processPayment);

// Verify M-Pesa payment status (requires auth because it queries user-specific data)
router.get('/verify/:checkoutRequestId', paymentController.verifyMpesaPayment);

module.exports = router;