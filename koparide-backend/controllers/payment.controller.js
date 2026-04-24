// controllers/payment.controller.js
const Stripe = require('stripe');
const { validationResult } = require('express-validator');
const { Reservation, Car, User } = require('../models');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Helper: Create a reservation record (used for both card and M‑Pesa)
 */
async function createReservationRecord(bookingData, userId, paymentReference = null, status = 'confirmed') {
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
    } = bookingData;

    const reservation = await Reservation.create({
        carId,
        userId,
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
        status, // 'confirmed' for card, 'payment_pending' for M‑Pesa
        paymentIntentId: paymentReference && paymentReference.startsWith('pi_') ? paymentReference : null,
        mpesaCheckoutId: paymentReference && paymentReference.includes('ws_') ? paymentReference : null,
        mpesaReceipt: null,
    });

    return reservation;
}

/**
 * Process a payment
 * For card: creates reservation only after Stripe confirms payment.
 * For M‑Pesa: creates reservation with status 'payment_pending', then after callback updates to 'confirmed'.
 */
exports.processPayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError(errors.array()[0].msg, 400);
        }

        const { method, booking, paymentDetails } = req.body;

        if (!booking || !booking.carId || !booking.startDate || !booking.endDate) {
            throw new AppError('Missing required booking details', 400);
        }

        const userId = req.user.id;

        // Verify car exists
        const car = await Car.findByPk(booking.carId);
        if (!car) {
            throw new NotFoundError('Car not found');
        }

        let paymentResult;

        // ---------- CARD PAYMENT (synchronous) ----------
        if (method === 'card') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(booking.totalAmount * 100),
                currency: (booking.currency || 'KES').toLowerCase(),
                payment_method: paymentDetails.paymentMethodId,
                confirmation_method: 'manual',
                confirm: true,
                return_url: `${process.env.FRONTEND_URL}/bookings/confirmation`,
                metadata: { userId, carId: booking.carId },
            });

            if (paymentIntent.status !== 'succeeded') {
                throw new AppError(`Card payment failed: ${paymentIntent.status}`, 400);
            }

            // Payment succeeded → create confirmed reservation
            const reservation = await createReservationRecord(booking, userId, paymentIntent.id, 'confirmed');

            paymentResult = {
                success: true,
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                reservation,
            };

            logger.info(`Card payment succeeded for user ${userId}, reservation ${reservation.id}`);
        }

        // ---------- M‑PESA PAYMENT (asynchronous) ----------
        else if (method === 'mpesa') {
            const phoneNumber = paymentDetails.phoneNumber;
            if (!phoneNumber || !/^254[0-9]{9}$/.test(phoneNumber)) {
                throw new AppError('Valid M‑Pesa phone number required (format 254XXXXXXXXX)', 400);
            }

            // Step 1: Create a reservation with status 'payment_pending'
            // This avoids needing a separate PendingBooking table.
            const tempReservation = await createReservationRecord(booking, userId, null, 'payment_pending');

            const mpesaService = require('../services/mpesa.service');
            const stkResponse = await mpesaService.stkPush(
                phoneNumber,
                booking.totalAmount,
                `RES${tempReservation.id}`.slice(0, 12),
                `Payment for reservation ${tempReservation.id}`
            );

            if (stkResponse.ResponseCode !== '0') {
                // STK push failed → delete the pending reservation or mark as failed
                await tempReservation.update({ status: 'failed' });
                throw new AppError('M‑Pesa initiation failed: ' + stkResponse.ResponseDescription, 400);
            }

            // Save the checkout ID on the pending reservation for later callback
            await tempReservation.update({ mpesaCheckoutId: stkResponse.CheckoutRequestID });

            paymentResult = {
                success: true,
                checkoutRequestId: stkResponse.CheckoutRequestID,
                merchantRequestId: stkResponse.MerchantRequestID,
                status: 'pending',
                message: 'STK push sent. Please complete payment on your phone.',
                reservationId: tempReservation.id, // send back so frontend can reference if needed
            };

            logger.info(`M‑Pesa STK push initiated for user ${userId}, reservation ${tempReservation.id}`);
        }

        res.json({ success: true, payment: paymentResult });
    } catch (err) {
        next(err);
    }
};

/**
 * Verify M‑Pesa payment status (polled by frontend)
 */
exports.verifyMpesaPayment = async (req, res, next) => {
    try {
        const { checkoutRequestId } = req.params;

        const reservation = await Reservation.findOne({
            where: { mpesaCheckoutId: checkoutRequestId, userId: req.user.id },
        });

        if (!reservation) {
            throw new NotFoundError('Payment session not found');
        }

        if (reservation.status === 'confirmed') {
            return res.json({
                success: true,
                isComplete: true,
                reservation,
            });
        }

        if (reservation.status === 'failed') {
            return res.json({
                success: false,
                isComplete: false,
                message: reservation.paymentError || 'Payment failed',
            });
        }

        // Still pending
        res.json({
            success: false,
            isComplete: false,
            status: reservation.status,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Stripe webhook (unchanged)
 */
exports.stripeWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            logger.error(`Webhook signature verification failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const userId = paymentIntent.metadata.userId;
                const carId = paymentIntent.metadata.carId;
                logger.info(`Stripe webhook: payment succeeded for user ${userId}, car ${carId}`);
                break;
            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    } catch (err) {
        next(err);
    }
};

/**
 * M‑Pesa callback handler – updates reservation from 'payment_pending' to 'confirmed' or 'failed'
 */
exports.mpesaCallback = async (req, res, next) => {
    try {
        const callbackData = req.body;
        logger.info('M-Pesa callback received', { data: callbackData });

        const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;
        if (!checkoutRequestId) {
            throw new AppError('Invalid callback data', 400);
        }

        const resultCode = callbackData.Body?.stkCallback?.ResultCode;
        const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;

        // Find the reservation by mpesaCheckoutId
        const reservation = await Reservation.findOne({
            where: { mpesaCheckoutId: checkoutRequestId },
        });

        if (!reservation) {
            logger.error(`No reservation found for checkout ID: ${checkoutRequestId}`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        if (resultCode === 0) {
            // Payment successful → update reservation to confirmed
            const metadata = callbackData.Body?.stkCallback?.CallbackMetadata?.Item || [];
            const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

            await reservation.update({
                status: 'confirmed',
                mpesaReceipt: receiptNumber,
                paymentError: null,
            });

            logger.info(`M-Pesa payment confirmed for reservation ${reservation.id}, receipt: ${receiptNumber}`);
        } else {
            // Payment failed
            await reservation.update({
                status: 'failed',
                paymentError: resultDesc,
            });
            logger.warn(`M-Pesa payment failed for reservation ${reservation.id}: ${resultDesc}`);
        }

        // Always respond with success to acknowledge receipt
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (err) {
        logger.error('M-Pesa callback error:', err);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
};