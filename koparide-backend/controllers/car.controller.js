/**
 * Car Controller
 * -------------------------
 * Handles HTTP requests for car listings.
 * Delegates business logic to CarService.
 * Maps service errors to HTTP responses.
 */

const CarService = require('../services/car.service');
const MailService = require('../services/mail.service');

module.exports = {
    /**
     * Create a new car listing (with images, logbook, insurance in one request)
     */
    async createCarListing(req, res, next) {
        try {
            // Extract files from the new multipart structure
            const imageFiles = req.files?.['images'] || [];      // array of image files
            const logbookFile = req.files?.['logbook']?.[0];    // single file or undefined
            const insuranceFile = req.files?.['insurance']?.[0];

            // Merge text fields (including existingImages – ignored for creation)
            const carData = {
                ownerId: req.user.id,
                ...req.body,
            };

            // Call service method that handles everything in a transaction
            const { car, images } = await CarService.createCarWithAssets(
                carData,
                imageFiles,
                logbookFile,
                insuranceFile
            );

            // Send email notification
            await MailService.sendMail({
                to: req.user.email,
                subject: 'Car Listing Pending Approval',
                html: `<p>Dear ${req.user.name},</p>
                       <p>Your car "${car.make} ${car.model}" has been submitted successfully.</p>
                       <p>It is now pending approval by our admin team (up to 24 hours).</p>
                       <p>Thank you for listing with us!</p>`,
            });

            res.status(201).json({
                message: 'Car listing submitted successfully. Pending approval.',
                car,
                images,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Update a car listing (with optional new images, logbook, insurance)
     */
    async updateCarListing(req, res, next) {
        try {
            const { id } = req.params;

            // 1. Extract text fields
            const updateData = {
                ownerId: req.user.id,
                ...req.body,
            };

            // 2. Parse existingImages (sent as JSON string from frontend)
            let existingImages = [];
            if (req.body.existingImages) {
                try {
                    existingImages = JSON.parse(req.body.existingImages);
                } catch {
                    existingImages = [];
                }
            }

            // 3. Extract uploaded files
            const newImageFiles = req.files?.['images'] || [];
            const newLogbookFile = req.files?.['logbook']?.[0];
            const newInsuranceFile = req.files?.['insurance']?.[0];

            // 4. Update car record (basic info + keep existing images)
            const updatedCar = await CarService.updateCarListing(id, updateData);
            if (!updatedCar) {
                return res.status(404).json({ message: 'Car listing not found' });
            }

            // 5. Upload new images (if any) – they will be added to CarImage table
            let newlyUploadedImages = [];
            if (newImageFiles.length > 0) {
                newlyUploadedImages = await CarService.uploadCarImages(id, newImageFiles);
            }

            // 6. Replace logbook if a new file is provided
            if (newLogbookFile) {
                const logbookUrl = `${process.env.BASE_URL}/uploads/cars/registration/${newLogbookFile.filename}`;
                await CarService.uploadRegistration(id, logbookUrl);
            }

            // 7. Replace insurance if a new file is provided
            if (newInsuranceFile) {
                const insuranceUrl = `${process.env.BASE_URL}/uploads/cars/insurance/${newInsuranceFile.filename}`;
                await CarService.uploadInsurance(id, insuranceUrl);
            }

            // 8. Build final image list for response
            const finalImages = [
                ...existingImages,
                ...newlyUploadedImages.map(img => img.url),
            ];

            // 9. Re-fetch full car with all relations
            const fullCar = await CarService.getCarById(id);

            // 10. Send email notification
            await MailService.sendMail({
                to: req.user.email,
                subject: 'Car Listing Updated - Pending Approval',
                html: `<p>Dear ${req.user.name},</p>
                       <p>Your car "${fullCar.make} ${fullCar.model}" has been updated successfully.</p>
                       <p>The changes are now pending approval by our admin team (up to 24 hours).</p>
                       <p>Thank you for keeping your listing up to date!</p>`,
            });

            res.status(200).json({
                message: 'Car listing updated successfully. Pending approval.',
                car: fullCar,
                images: finalImages,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload car images (kept for backward compatibility – not used by new frontend)
     */
    async uploadCarImages(req, res, next) {
        try {
            const { id } = req.params;
            const imageFiles = req.files?.['images'] || [];
            const uploadedImages = await CarService.uploadCarImages(id, imageFiles);
            res.status(200).json({
                message: 'Car images uploaded successfully',
                images: uploadedImages,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload insurance document (kept for backward compatibility)
     */
    async uploadInsurance(req, res, next) {
        try {
            const { id } = req.params;
            const file = req.file;
            if (!file) return res.status(400).json({ message: 'No file uploaded' });
            const insuranceUrl = `${process.env.BASE_URL}/uploads/cars/insurance/${file.filename}`;
            const car = await CarService.uploadInsurance(id, insuranceUrl);
            res.status(200).json({ message: 'Insurance uploaded successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Upload registration/logbook document (kept for backward compatibility)
     */
    async uploadRegistration(req, res, next) {
        try {
            const { id } = req.params;
            const file = req.file;
            if (!file) return res.status(400).json({ message: 'No file uploaded' });
            const registrationUrl = `${process.env.BASE_URL}/uploads/cars/registration/${file.filename}`;
            const car = await CarService.uploadRegistration(id, registrationUrl);
            res.status(200).json({ message: 'Registration uploaded successfully', car });
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
     */
    async getCarById(req, res, next) {
        try {
            const { id } = req.params;
            const car = await CarService.getCarById(id);
            if (!car) return res.status(404).json({ error: 'Car not found' });
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
     * Rent car
     */
    async rentCar(req, res, next) {
        try {
            const { id } = req.params;
            const renterId = req.user.id;
            const car = await CarService.rentCar(id, renterId);
            await MailService.sendEmail(
                req.user.email,
                'Car Rental Confirmation',
                `Dear ${req.user.name},\n\nYou have successfully rented the car "${car.make} ${car.model}".\nPrice per day: ${car.pricePerDay}\nOwner ID: ${car.ownerId}\n\nEnjoy your ride!`
            );
            res.status(200).json({ message: 'Car rented successfully', car });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Return car
     */
    async returnCar(req, res, next) {
        try {
            const car = await CarService.returnCar(req.params.id);
            res.status(200).json({ message: 'Car returned successfully', car });
        } catch (err) {
            next(err);
        }
    },
};