const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

// Validation rules
const paymentValidation = [
    body('method').isIn(['card', 'mpesa']).withMessage('Valid payment method required'),
    body('reservationId').isInt().withMessage('Valid reservation ID required'),
];

// All payment routes require authentication
router.use(auth);

// Process payment
router.post('/process',
    paymentValidation,
    body('paymentDetails').notEmpty().withMessage('Payment details required'),
    paymentController.processPayment
);

// Verify M-Pesa payment status
router.get('/verify/:checkoutRequestId', paymentController.verifyMpesaPayment);

module.exports = router;

// Public webhook endpoints (no auth)
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
router.post('/mpesa-callback', express.raw({ type: 'application/json' }), paymentController.mpesaCallback);