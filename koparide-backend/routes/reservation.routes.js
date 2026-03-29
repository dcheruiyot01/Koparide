const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const reservationController = require('../controllers/reservation.controller');

// Validation rules
const reservationValidation = [
    body('carId').isInt().withMessage('Valid car ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('pickupLocation').notEmpty().withMessage('Pickup location is required'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Valid total amount is required'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Valid currency is required'),
];

// All reservation routes require authentication
router.use(auth);

// Create a new reservation
router.post('/', reservationValidation, reservationController.createReservation);

// Get user's reservations
router.get('/', reservationController.getUserReservations);

// Get specific reservation
router.get('/:id', reservationController.getReservation);

// Cancel reservation
router.patch('/:id/cancel', reservationController.cancelReservation);

module.exports = router;