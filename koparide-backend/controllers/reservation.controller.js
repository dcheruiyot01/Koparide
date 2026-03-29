const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Reservation, Car, User } = require('../models');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a new reservation
 */
exports.createReservation = async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError(errors.array()[0].msg, 400);
        }

        const {
            carId,
            startDate,
            endDate,
            pickupLocation,
            protectionPlan,
            promoCode,
            subtotal,
            protectionCost,
            taxAmount,
            discountAmount,
            totalAmount,
            currency,
        } = req.body;
        // Verify car exists and is available
        const car = await Car.findByPk(carId);
        if (!car) {
            throw new NotFoundError('Car not found');
        }

        // Check if car is available for the dates (optional - implement your availability logic)
        const existingReservation = await Reservation.findOne({
            where: {
                carId,
                status: ['pending', 'confirmed'],
                [Op.or]: [
                    {
                        startDate: { [Op.between]: [startDate, endDate] },
                    },
                    {
                        endDate: { [Op.between]: [startDate, endDate] },
                    },
                ],
            },
        });

        if (existingReservation) {
            throw new AppError('Car is not available for the selected dates', 409);
        }

        // Create reservation
        const reservation = await Reservation.create({
            carId,
            userId: req.user.id,
            startDate,
            endDate,
            pickupLocation: pickupLocation,
            protectionPlan,
            promoCode,
            subtotal,
            protectionCost,
            taxAmount,
            discountAmount,
            totalAmount,
            currency,
            status: 'pending',
        });

        logger.info(`Reservation created: ${reservation.id} for user ${req.user.id}`);

        // Fetch the reservation with associated data
        const createdReservation = await Reservation.findByPk(reservation.id, {
            include: [
                { model: Car, as: 'car' },
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            ],
        });

        res.status(201).json({
            success: true,
            reservation: createdReservation,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get user's reservations
 */
exports.getUserReservations = async (req, res, next) => {
    try {
        const reservations = await Reservation.findAll({
            where: { userId: req.user.id },
            include: [
                { model: Car, as: 'car' },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({
            success: true,
            reservations,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get a specific reservation
 */
exports.getReservation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findOne({
            where: {
                id,
                userId: req.user.id,
            },
            include: [
                { model: Car, as: 'car' },
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            ],
        });

        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        res.json({
            success: true,
            reservation,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Cancel a reservation
 */
exports.cancelReservation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findOne({
            where: {
                id,
                userId: req.user.id,
            },
        });

        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        if (reservation.status === 'cancelled') {
            throw new AppError('Reservation is already cancelled', 400);
        }

        if (reservation.status === 'completed') {
            throw new AppError('Cannot cancel a completed reservation', 400);
        }

        reservation.status = 'cancelled';
        await reservation.save();

        logger.info(`Reservation cancelled: ${reservation.id} by user ${req.user.id}`);

        res.json({
            success: true,
            message: 'Reservation cancelled successfully',
        });
    } catch (err) {
        next(err);
    }
};