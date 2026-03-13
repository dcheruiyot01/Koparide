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
            // 1. Create base car record
            const car = await CarService.createCarListing({
                ownerId: req.user.id,
                ...req.body
            });

            if (!car) {
                return res.status(400).json({ message: "Car could not be created" });
            }

            // 2. Upload images (if any were attached)
            let uploadedImages = [];
            if (req.files && req.files.length > 0) {
                uploadedImages = await CarService.uploadCarImages(car.id, req.files);
            }

            // 3. Re-fetch full car with images included
            const fullCar = await CarService.getCarById(car.id);

            // 4. Send email notification
            await MailService.sendMail({
                to: req.user.email,
                subject: "Car Listing Pending Approval",
                html: `
                <p>Dear ${req.user.name},</p>
                <p>Your car "${car.make} ${car.model}" has been submitted successfully.</p>
                <p>It is now pending approval by our admin team (up to 24 hours).</p>
                <p>Thank you for listing with us!</p>
            `
            });

            // 5. Respond with created car
            res.status(201).json({
                message: "Car listing submitted successfully. Pending approval.",
                car: fullCar,
                images: uploadedImages.map(img => img.url)
            });

        } catch (err) {
            next(err);
        }
    },

    /**
     * Update a car listing
     * - Owner must be authenticated (req.user)
     * - Sends notification email to owner
     */
    async updateCarListing(req, res, next) {
        try {
            const { id } = req.params;

            // 1. Extract text fields
            const updateData = {
                ownerId: req.user.id,
                ...req.body
            };

            // 2. Update base car fields
            const updatedCar = await CarService.updateCarListing(id, updateData);
            if (!updatedCar) {
                return res.status(404).json({ message: "Car listing not found" });
            }

            // 3. Handle existing images from body
            const { existingImages } = req.body;
            let oldImages = [];
            if (existingImages) {
                oldImages = Array.isArray(existingImages)
                    ? existingImages
                    : JSON.parse(existingImages);
            }

            // 4. Upload new images (if any)
            let newImages = [];
            if (req.files && req.files.length > 0) {
                newImages = await CarService.uploadCarImages(updatedCar.id, req.files);
            }

            // 5. Combine old + new (URLs only for response, DB handled in uploadCarImages)
            const finalImages = [
                ...oldImages,
                ...newImages.map(img => img.url)
            ];

            // 6. Re-fetch full car with images included
            const fullCar = await CarService.getCarById(updatedCar.id);

            // 7. Send email notification
            await MailService.sendMail({
                to: req.user.email,
                subject: "Car Listing Updated - Pending Approval",
                html: `
                <p>Dear ${req.user.name},</p>
                <p>Your car "${updatedCar.make} ${updatedCar.model}" has been updated successfully.</p>
                <p>The changes are now pending approval by our admin team (up to 24 hours).</p>
                <p>Thank you for keeping your listing up to date!</p>
            `
            });

            // 8. Respond with updated car
            res.status(200).json({
                message: "Car listing updated successfully. Pending approval.",
                car: fullCar,
                images: finalImages
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

    // controllers/carController.js

    /**
     * Upload insurance document (multer single file)
     */
    async uploadInsurance(req, res, next) {
        try {
            const { id } = req.params;
            // req.file.filename is set by multer (if using disk storage with filename)
            const filename = req.file.filename;
            const insuranceUrl = `${process.env.BASE_URL}/uploads/cars/insurance/${filename}`;

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
     * Upload Registration/LogBook document (multer single file)
     */
    async uploadRegistration(req, res, next) {
        try {
            const { id } = req.params;
            const filename = req.file.filename;
            const registrationUrl = `${process.env.BASE_URL}/uploads/cars/registration/${filename}`;

            const car = await CarService.uploadRegistration(id, registrationUrl);

            res.status(200).json({
                message: 'Registration uploaded successfully',
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
