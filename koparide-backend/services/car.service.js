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
     * Upload car images
     * - Wraps in transaction to ensure consistency
     */
    async uploadCarImages(carId, images) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');

        return sequelize.transaction(async (t) => {
            const created = await Promise.all(
                images.map((url, idx) =>
                    CarImage.create(
                        {
                            carId: car.id,
                            url,
                            altText: `${car.make} ${car.model}`,
                            isPrimary: idx === 0,
                            position: idx
                        },
                        { transaction: t }
                    )
                )
            );
            return { ...car.toJSON(), images: created };
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
     * Supports pagination and filters
     */
    async getPublicCars({ page = 1, limit = 10, classification, location }) {
        const where = { status: 'approved', is_deleted: false };
        if (classification) where.classification = classification;
        if (location) where.location = location;

        const { rows, count } = await Car.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit
        });

        return {
            data: rows,
            meta: { total: count, page, limit }
        };
    },

    /**
     * Soft delete a car listing
     * Prevent deletion if currently rented
     */
    async deleteCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        if (car.rented_to) throw new Error('Cannot delete car while rented');
        return car.update({ is_deleted: true });
    },

    /**
     * Rent car (assign renter)
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
     * -------------------------
     * Returns a single car with its images, owner, and renter info.
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
     * Return car (clear renter)
     */
    async returnCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ rented_to: null });
    }
};
