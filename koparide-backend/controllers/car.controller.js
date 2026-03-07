/**
 * Car Controller
 * -------------------------
 * Handles HTTP requests for car listings.
 * Delegates business logic to CarService.
 * Maps service errors to HTTP responses.
 */

const CarService = require('../services/car.service');
const MailService = require('../services/mail.service'); // notification emails

module.exports = {
    /**
     * Create a new car listing
     * - Owner must be authenticated (req.user)
     * - Sends notification email to owner
     */
    async createCarListing(req, res, next) {
        try {
            const car = await CarService.createCarListing({
                ownerId: req.user.id,
                ...req.body
            });

            await MailService.sendEmail(
                req.user.email,
                'Car Listing Pending Approval',
                `Dear ${req.user.name},

Your car "${car.make} ${car.model}" has been submitted successfully.
It is now pending approval by our admin team (up to 24 hours).

Thank you for listing with us!`
            );

            res.status(201).json({
                message: 'Car listing submitted successfully. Pending approval.',
                car
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload car images (multer provides req.files)
     */
    async uploadCarImages(req, res, next) {
        try {
            const { id } = req.params;
            const images = req.files.map(file => file.path);

            const car = await CarService.uploadCarImages(id, images);

            res.status(200).json({
                message: 'Car images uploaded successfully',
                car
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload insurance document (multer single file)
     */
    async uploadInsurance(req, res, next) {
        try {
            const { id } = req.params;
            const insuranceUrl = req.file.path;

            const car = await CarService.uploadInsurance(id, insuranceUrl);

            res.status(200).json({
                message: 'Insurance uploaded successfully',
                car
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
            const car = await CarService.approveCar(req.params.id);
            res.status(200).json({ message: 'Car approved successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Reject car listing (admin only)
     */
    async rejectCar(req, res, next) {
        try {
            const car = await CarService.rejectCar(req.params.id);
            res.status(200).json({ message: 'Car rejected successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Get all public cars (approved + not deleted)
     * Supports pagination and filters via query params
     */
    async getPublicCars(req, res, next) {
        try {
            const cars = await CarService.getPublicCars(req.query);
            res.status(200).json(cars);
        } catch (err) {
            next(err);
        }
    },
    /**
     * Get car details by ID
     * -------------------------
     * Returns a single car with its images, owner, and renter info.
     */
    async getCarById(req, res, next) {
        try {
            const { id } = req.params;
            const car = await CarService.getCarById(id);

            if (!car) {
                return res.status(404).json({ error: 'Car not found' });
            }

            res.status(200).json(car);
        } catch (err) {
            next(err);
        }
    },

    /**
     * Soft delete car (owner removes car)
     */
    async deleteCar(req, res, next) {
        try {
            const car = await CarService.deleteCar(req.params.id);
            res.status(200).json({ message: 'Car deleted successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Rent car (assign renter user ID)
     * - Sends notification email to renter
     */
    async rentCar(req, res, next) {
        try {
            const { id } = req.params;
            const renterId = req.user.id;

            const car = await CarService.rentCar(id, renterId);

            await MailService.sendEmail(
                req.user.email,
                'Car Rental Confirmation',
                `Dear ${req.user.name},

You have successfully rented the car "${car.make} ${car.model}".
Price per day: ${car.pricePerDay}
Owner ID: ${car.ownerId}

Enjoy your ride!`
            );

            res.status(200).json({ message: 'Car rented successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Return car (clear rented_to)
     */
    async returnCar(req, res, next) {
        try {
            const car = await CarService.returnCar(req.params.id);
            res.status(200).json({ message: 'Car returned successfully', car });
        } catch (err) {
            next(err);
        }
    }
};
