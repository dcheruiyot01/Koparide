const Stripe = require('stripe');
const { validationResult } = require('express-validator');
const { Reservation } = require('../models');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Process a payment
 */
exports.processPayment = async (req, res, next) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError(errors.array()[0].msg, 400);
        }

        const { method, reservationId, paymentDetails } = req.body;

        // Find reservation and verify ownership
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId,
                userId: req.user.id,
            },
        });

        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        if (reservation.status !== 'pending') {
            throw new AppError('Reservation is not in pending state', 400);
        }

        let paymentResult;

        if (method === 'card') {
            // Process card payment with Stripe
            // Process card payment with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(reservation.totalAmount * 100),
                currency: reservation.currency.toLowerCase(),
                payment_method: paymentDetails.paymentMethodId,
                confirmation_method: 'manual',
                confirm: true,
                return_url: `${process.env.FRONTEND_URL}/bookings/confirmation`,
                metadata: {
                    reservationId: reservation.id,
                    userId: req.user.id,
                },
            });

            paymentResult = {
                success: paymentIntent.status === 'succeeded',
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
            };

            if (paymentIntent.status === 'succeeded') {
                reservation.status = 'confirmed';
                reservation.paymentIntentId = paymentIntent.id;
            }
        } else if (method === 'mpesa') {
            // Validate phone number (basic format)
            const phoneNumber = paymentDetails.phoneNumber;
            if (!phoneNumber || !/^254[0-9]{9}$/.test(phoneNumber)) {
                throw new AppError('Valid M‑Pesa phone number required (format 254XXXXXXXXX)', 400);
            }

            // Initiate STK Push using the service
            const mpesaService = require('../services/mpesa.service'); // adjust path
            const stkResponse = await mpesaService.stkPush(
                phoneNumber,
                reservation.totalAmount,
                `RES${reservation.id}`,               // account reference (max 12 chars)
                `Payment for reservation ${reservation.id}`
            );

            // Check if STK push was accepted (ResponseCode '0' means accepted)
            if (stkResponse.ResponseCode !== '0') {
                throw new AppError('M‑Pesa initiation failed: ' + stkResponse.ResponseDescription, 400);
            }

            paymentResult = {
                success: true,
                checkoutRequestId: stkResponse.CheckoutRequestID,
                merchantRequestId: stkResponse.MerchantRequestID,
                status: 'pending',
                message: 'STK push sent to your phone. Please complete the payment on your device.',
            };

            // Save the checkout ID in your reservation record
            reservation.mpesaCheckoutId = stkResponse.CheckoutRequestID;
            // reservation.status remains 'pending' until callback confirms
        }

        await reservation.save();

        logger.info(`Payment processed for reservation ${reservation.id}: ${method}`);

        res.json({
            success: true,
            payment: paymentResult,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Verify M-Pesa payment status
 */
exports.verifyMpesaPayment = async (req, res, next) => {
    try {
        const { checkoutRequestId } = req.params;

        // Find reservation by checkout ID
        const reservation = await Reservation.findOne({
            where: {
                mpesaCheckoutId: checkoutRequestId,
                userId: req.user.id,
            },
        });

        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        // Here you would query the M-Pesa API for the actual status
        // This is a placeholder
        const status = {
            status: reservation.status,
            isComplete: reservation.status === 'confirmed',
            receipt: reservation.mpesaReceipt,
        };

        res.json({
            success: true,
            ...status,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Stripe webhook handler
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

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const reservationId = paymentIntent.metadata.reservationId;

                await Reservation.update(
                    { status: 'confirmed', paymentIntentId: paymentIntent.id },
                    { where: { id: reservationId } }
                );

                logger.info(`Payment succeeded for reservation ${reservationId}`);
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                const failedReservationId = failedIntent.metadata.reservationId;

                await Reservation.update(
                    { status: 'failed' },
                    { where: { id: failedReservationId } }
                );

                logger.warn(`Payment failed for reservation ${failedReservationId}`);
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
 * M-Pesa callback handler
 */
exports.mpesaCallback = async (req, res, next) => {
    try {
        const callbackData = req.body;

        // Log the callback
        logger.info('M-Pesa callback received', { data: callbackData });

        // Extract checkout request ID from callback
        const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;

        if (!checkoutRequestId) {
            throw new AppError('Invalid callback data', 400);
        }

        const resultCode = callbackData.Body?.stkCallback?.ResultCode;
        const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;

        // Find reservation
        const reservation = await Reservation.findOne({
            where: { mpesaCheckoutId: checkoutRequestId },
        });

        if (!reservation) {
            logger.error(`Reservation not found for checkout ID: ${checkoutRequestId}`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        if (resultCode === 0) {
            // Payment successful
            const metadata = callbackData.Body?.stkCallback?.CallbackMetadata?.Item || [];
            const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

            reservation.status = 'confirmed';
            reservation.mpesaReceipt = receiptNumber;
            await reservation.save();

            logger.info(`M-Pesa payment confirmed for reservation ${reservation.id}, receipt: ${receiptNumber}`);
        } else {
            // Payment failed
            reservation.status = 'failed';
            reservation.paymentError = resultDesc;
            await reservation.save();

            logger.warn(`M-Pesa payment failed for reservation ${reservation.id}: ${resultDesc}`);
        }

        // Always respond with success to acknowledge receipt
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (err) {
        logger.error('M-Pesa callback error:', err);
        res.status(200).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
    }
};