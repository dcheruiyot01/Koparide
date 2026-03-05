/**
 * Car Controller
 * -------------------------
 * Handles HTTP requests for car listings.
 * Delegates business logic to CarService.
 * Sends notifications to owners and renters.
 */

const CarService = require('../services/car.service');
const MailService = require('../services/mail.service'); // mail service

module.exports = {
    /**
     * Create a new car listing
     * - Notify owner that car is pending approval (24 hours)
     */
    async createCarListing(req, res, next) {
        try {
            const result = await CarService.createCarListing({
                ownerId: req.user.id,
                ...req.body
            });

            // Send notification email to owner
            await MailService.sendEmail(
                req.user.email,
                'Car Listing Pending Approval',
                `Dear ${req.user.name},

Your car "${result.make} ${result.model}" has been submitted successfully.
It is now pending approval by our admin team. Approval usually takes up to 24 hours.

Thank you for listing with us!

-- TODO: Replace this plain text with a proper email template.`
            );

            return res.status(201).json({
                message: 'Car listing submitted successfully. Pending approval (24 hours).',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload car images
     */
    async uploadCarImages(req, res, next) {
        try {
            const { id } = req.params;
            const images = req.files.map(file => file.path); // multer provides req.files

            const result = await CarService.uploadCarImages(id, images);

            return res.status(200).json({
                message: 'Car images uploaded successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload insurance document
     */
    async uploadInsurance(req, res, next) {
        try {
            const { id } = req.params;
            const insuranceUrl = req.file.path; // multer single file

            const result = await CarService.uploadInsurance(id, insuranceUrl);

            return res.status(200).json({
                message: 'Insurance uploaded successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Approve car listing (admin only)
     */
    async approveCar(req, res, next) {
        try {
            const { id } = req.params;
            const result = await CarService.approveCar(id);

            return res.status(200).json({
                message: 'Car approved successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Reject car listing (admin only)
     */
    async rejectCar(req, res, next) {
        try {
            const { id } = req.params;
            const result = await CarService.rejectCar(id);

            return res.status(200).json({
                message: 'Car rejected successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Get all public cars (approved + not deleted)
     */
    async getPublicCars(req, res, next) {
        try {
            const cars = await CarService.getPublicCars();

            return res.status(200).json(cars);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Soft delete car (owner removes car)
     */
    async deleteCar(req, res, next) {
        try {
            const { id } = req.params;
            const result = await CarService.deleteCar(id);

            return res.status(200).json({
                message: 'Car deleted successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Rent car (assign renter user ID)
     */
    /**
     * Rent car (assign renter user ID)
     * - Notify renter with car details
     */
    async rentCar(req, res, next) {
        try {
            const { id } = req.params;
            const renterId = req.user.id;

            const result = await CarService.rentCar(id, renterId);

            // Send notification email to renter
            await MailService.sendEmail(
                req.user.email,
                'Car Rental Confirmation',
                `Dear ${req.user.name},

You have successfully rented the car "${result.make} ${result.model}".
Price per day: ${result.pricePerDay}
Owner: ${result.ownerId}

Enjoy your ride!

-- TODO: Replace this plain text with a proper email template.`
            );

            return res.status(200).json({
                message: 'Car rented successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Return car (clear rented_to)
     */
    async returnCar(req, res, next) {
        try {
            const { id } = req.params;
            const result = await CarService.returnCar(id);

            return res.status(200).json({
                message: 'Car returned successfully',
                car: result
            });
        } catch (err) {
            next(err);
        }
    }
};
