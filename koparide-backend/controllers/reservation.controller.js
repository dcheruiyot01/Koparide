const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Reservation, Car, User, Profile } = require('../models'); // Added Profile
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const MailService = require('../services/mail.service');

/**
 * Create a new reservation
 * - Sends email notification to car owner with booking details and renter information
 */
exports.createReservation = async (req, res, next) => {
    try {
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

        // Verify car exists
        const car = await Car.findByPk(carId);
        if (!car) {
            throw new NotFoundError('Car not found');
        }

        // Check availability
        const existingReservation = await Reservation.findOne({
            where: {
                carId,
                status: ['pending', 'confirmed'],
                [Op.or]: [
                    { startDate: { [Op.between]: [startDate, endDate] } },
                    { endDate: { [Op.between]: [startDate, endDate] } },
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
            pickupLocation,
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

        // ========== SEND EMAIL TO CAR OWNER ==========
        const MINUTE = 60000;
        // Helper to calculate days
        const calculateDays = (start, end) => {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffTime = Math.abs(endDate - startDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        const daysCount = calculateDays(startDate, endDate);
        const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Fetch renter's profile
        const renterProfile = await Profile.findOne({
            where: { userid: req.user.id },
            attributes: ['firstName', 'lastName', 'driversLicenseNumber', 'driversLicenseUrl', 'nationalIdUrl']
        });

        // Fetch car owner's user
        const owner = await User.findByPk(car.ownerId, {
            attributes: ['email', 'name']
        });

        if (owner && owner.email && renterProfile) {
            const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const reservationLink = `${frontendBaseUrl}/reservations/${reservation.id}`;

            const driverLicenseLink = renterProfile.driversLicenseUrl
                ? `<a href="${renterProfile.driversLicenseUrl}" target="_blank">View Driver's License</a>`
                : 'Not provided';

            const identityCardLink = renterProfile.nationalIdUrl
                ? `<a href="${renterProfile.nationalIdUrl}" target="_blank">View Identity Card</a>`
                : 'Not provided';

            const emailHtml = `
                <h2>New Booking Confirmation</h2>
                <p>Dear ${owner.name || 'Car Owner'},</p>
                <p>Your vehicle <strong>${car.make} ${car.model}</strong> has been successfully booked!</p>
                <p><strong>Booking Details:</strong><br/>
                Reservation ID: ${reservation.id}<br/>
                Booking Dates: ${formattedStartDate} – ${formattedEndDate}<br/>
                Number of days: ${daysCount}<br/>
                Total Amount: ${totalAmount} ${currency}<br/>
                Pickup Location: ${pickupLocation || 'To be confirmed'}<br/>
                <a href="${reservationLink}">View full reservation details</a>
                </p>
                <p><strong>Renter Information:</strong><br/>
                Name: ${renterProfile.firstName || ''} ${renterProfile.lastName || ''}<br/>
                Driver's License Number: ${renterProfile.driversLicenseNumber || 'Not provided'}<br/>
                Driver's License Document: ${driverLicenseLink}<br/>
                Identity Card Document: ${identityCardLink}
                </p>
                <p><strong>Acknowledgement:</strong><br/>
                The renter agrees to return the vehicle in the same condition as received, normal wear and tear excepted, and acknowledges the Terms and Conditions of the rental agreement.</p>
                <p>If you have any questions, please contact support.</p>
                <p>Thank you for being a host on our platform!</p>
            `;

            try {
                await MailService.sendMail({
                    to: owner.email,
                    subject: `New booking for your ${car.make} ${car.model}`,
                    html: emailHtml,
                });
                logger.info(`Booking confirmation email sent to owner for reservation ${reservation.id}`);
            } catch (emailErr) {
                logger.error(`Failed to send email to owner for reservation ${reservation.id}:`, emailErr);
                // Do not throw – reservation already created
            }
        } else {
            logger.warn(`Cannot send email: owner email (${owner?.email}) or renter profile (${!!renterProfile}) missing for reservation ${reservation.id}`);
        }

        // Fetch full reservation with associations
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