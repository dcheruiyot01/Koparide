/**
 * Car Service
 * -------------------------
 * Handles business logic for car listings.
 * Uses Sequelize models and transactions.
 * Now supports DigitalOcean Spaces for all file uploads.
 */

const { sequelize, Car, CarImage } = require('../models');
const storageService = require('./storage.service'); // 👈 new

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

module.exports = {
    /**
     * Create a new car listing (basic info, no files)
     */
    async createCarListing(data) {
        const payload = {
            ...data,
            classification: data.classification || 'Saloon',
            status: 'pending'
        };
        return Car.create(payload);
    },

    /**
     * Update car listing (text fields only)
     */
    async updateCarListing(id, data) {
        return Car.update(data, {
            where: { id },
            returning: true
        }).then(([count, rows]) => rows[0]);
    },

    /**
     * Upload car images (one or many) – directly to Spaces
     * - Accepts req.files from Multer (memory storage)
     * - Saves metadata into CarImage table
     * - Ensures only one primary image exists
     * - Returns array of saved image objects (with CDN URLs)
     */
    async uploadCarImages(carId, files = []) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        if (!files || files.length === 0) return [];

        return sequelize.transaction(async (t) => {
            // Check if car already has a primary image
            const existingPrimary = await CarImage.findOne({
                where: { carId, isPrimary: true },
                transaction: t
            });

            let shouldSetPrimary = !existingPrimary;
            const savedImages = [];

            // Upload all files to Spaces first to get CDN URLs
            const imageUrls = await storageService.uploadCarImages(files, carId);

            // Save each URL in CarImage table
            for (let i = 0; i < imageUrls.length; i++) {
                const saved = await CarImage.create(
                    {
                        carId,
                        url: imageUrls[i],
                        altText: `${car.make} ${car.model}`,
                        isPrimary: shouldSetPrimary,
                        position: i
                    },
                    { transaction: t }
                );
                savedImages.push(saved);
                if (shouldSetPrimary) shouldSetPrimary = false;
            }

            return savedImages;
        });
    },

    /**
     * Upload insurance document – directly to Spaces
     */
    async uploadInsurance(carId, insuranceFile) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        const insuranceUrl = await storageService.uploadDocument(insuranceFile, carId, 'insurance');
        await car.update({ insurance_url: insuranceUrl });
        return car;
    },

    /**
     * Upload registration/logbook document – directly to Spaces
     */
    async uploadRegistration(carId, logbookFile) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        const logbookUrl = await storageService.uploadDocument(logbookFile, carId, 'registration');
        await car.update({ logbook_url: logbookUrl });
        return car;
    },

    async approveCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ status: 'approved', is_deleted: null });
    },

    async rejectCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ status: 'rejected' });
    },

    /**
     * Get all public cars (approved + not deleted)
     */
    async getPublicCars({ page = 1, limit = 100, classification, location }) {
        const where = {};
        if (classification) where.classification = classification;
        if (location) where.location = location;

        const { rows, count } = await Car.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit,
            include: [
                { model: require('../models/CarImage'), as: 'imagesList' },
                { model: require('../models/User'), as: 'owner', attributes: ['id', 'name', 'email', 'createdAt'] },
                { model: require('../models/User'), as: 'renter', attributes: ['id', 'name', 'email', 'createdAt'] },
            ]
        });
        return {
            data: rows,
            meta: { total: count, page, limit }
        };
    },

    /**
     * Soft delete a car listing
     */
    async deleteCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        if (car.rented_to) throw new Error('Cannot delete car while rented');
        return car.update({ is_deleted: true, status: 'deleted' });
    },

    /**
     * Rent car
     */
    async rentCar(carId, renterId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        if (car.is_deleted) throw new Error('Car is deleted');
        if (car.rented_to) throw new Error('Car is already rented');
        return car.update({ rented_to: renterId });
    },

    /**
     * Get car details by ID
     */
    async getCarById(id) {
        const car = await Car.findByPk(id, {
            include: [
                { model: require('../models/CarImage'), as: 'imagesList' },
                { model: require('../models/User'), as: 'owner', attributes: ['id', 'name', 'email', 'createdAt'] },
                { model: require('../models/User'), as: 'renter', attributes: ['id', 'name', 'email', 'createdAt'] }
            ]
        });
        if (!car || car.is_deleted) return null;
        return car;
    },

    /**
     * Return car
     */
    async returnCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ rented_to: null });
    },

    /**
     * Create a new car listing WITH all assets (images, logbook, insurance)
     * All files are uploaded directly to Spaces inside a transaction.
     */
    async createCarWithAssets(carData, imageFiles = [], logbookFile = null, insuranceFile = null) {
        const transaction = await sequelize.transaction();
        try {
            // 1. Create the car record
            const car = await Car.create({
                ...carData,
                status: 'pending'
            }, { transaction });

            // 2. Upload images to Spaces and save metadata
            let savedImages = [];
            if (imageFiles && imageFiles.length) {
                const imageUrls = await storageService.uploadCarImages(imageFiles, car.id);
                for (let i = 0; i < imageUrls.length; i++) {
                    const img = await CarImage.create({
                        carId: car.id,
                        url: imageUrls[i],
                        altText: `${car.make} ${car.model}`,
                        isPrimary: i === 0,
                        position: i
                    }, { transaction });
                    savedImages.push(img);
                }
            }

            // 3. Upload logbook (if provided)
            if (logbookFile) {
                const logbookUrl = await storageService.uploadDocument(logbookFile, car.id, 'registration');
                await car.update({ logbook_url: logbookUrl }, { transaction });
            }

            // 4. Upload insurance (if provided)
            if (insuranceFile) {
                const insuranceUrl = await storageService.uploadDocument(insuranceFile, car.id, 'insurance');
                await car.update({ insurance_url: insuranceUrl }, { transaction });
            }

            await transaction.commit();

            // Fetch full car with relations
            const fullCar = await this.getCarById(car.id);
            return { car: fullCar, images: savedImages.map(i => i.url) };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};