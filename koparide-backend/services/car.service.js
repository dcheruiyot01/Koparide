/**
 * Car Service
 * -------------------------
 * Handles business logic for car listings.
 * Uses Sequelize models and transactions.
 */

const { sequelize, Car, CarImage } = require('../models');

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

module.exports = {
    /**
     * Create a new car listing
     * - Defaults classification to 'Saloon'
     * - Sets status to 'pending'
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
     * Update car listing
     */
    async updateCarListing(id, data) {
        return Car.update(data, {
            where: { id },
            returning: true
        }).then(([count, rows]) => rows[0]);
    },

    /**
     * Upload car images (one or many)
     * - Accepts req.files from Multer
     * - Saves metadata into CarImage table
     * - Ensures only one primary image exists
     * - Returns array of saved images
     */
    async uploadCarImages(carId, files = []) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');

        if (!files || files.length === 0) {
            return [];
        }

        return sequelize.transaction(async (t) => {
            // Check if car already has a primary image
            const existingPrimary = await CarImage.findOne({
                where: { carId, isPrimary: true },
                transaction: t
            });

            let shouldSetPrimary = !existingPrimary;
            const savedImages = [];

            for (const file of files) {
                const imageUrl =  process.env.BASE_URL+`/uploads/cars/${file.filename}`;

                const saved = await CarImage.create(
                    {
                        carId,
                        url: imageUrl,
                        altText: `${car.make} ${car.model}`,
                        isPrimary: shouldSetPrimary,
                        position: savedImages.length
                    },
                    { transaction: t }
                );

                savedImages.push(saved);

                // Only the first uploaded image becomes primary (if none existed)
                if (shouldSetPrimary) {
                    shouldSetPrimary = false;
                }
            }

            return savedImages;
        });
    },

    /**
     * Upload insurance document
     */
    async uploadInsurance(carId, insuranceUrl) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ insuranceUrl });
    },

    async approveCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ status: 'approved' });
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
        // const where = { status: 'approved', is_deleted: false };
        if (classification) where.classification = classification;
        if (location) where.location = location;

        const { rows, count } = await Car.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit,
            include: [
                { model: require('../models/CarImage'), as: 'imagesList' },
                { model: require('../models/User'), as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: require('../models/User'), as: 'renter', attributes: ['id', 'name', 'email'] }
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
        return car.update({ is_deleted: true });
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
                { model: require('../models/User'), as: 'owner', attributes: ['id', 'name', 'email'] },
                { model: require('../models/User'), as: 'renter', attributes: ['id', 'name', 'email'] }
            ]
        });

        if (!car || car.is_deleted) {
            return null;
        }

        return car;
    },

    /**
     * Return car
     */
    async returnCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ rented_to: null });
    }
};
