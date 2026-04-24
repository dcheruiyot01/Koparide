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

    // services/CarService.js

    /**
     * Upload insurance document URL to car record
     */
    async uploadInsurance(carId, insurance_url) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ insurance_url }); // field name in Car model
    },

    /**
     * Upload registration document URL to car record
     */
    async uploadRegistration(carId, logbook_url) {
        const car = await Car.findByPk(carId);
        if (!car) throw new NotFoundError('Car not found');
        return car.update({ logbook_url }); // field name in Car model
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
                { model: require('../models/User'), as: 'owner', attributes: ['id', 'name', 'email','createdAt'] },
                { model: require('../models/User'), as: 'renter', attributes: ['id', 'name', 'email','createdAt'] }
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
    },

    //
    async createCarWithAssets(carData, imageFiles = [], logbookFile = null, insuranceFile = null) {
        const transaction = await sequelize.transaction();
        try {
            // 1. Create the car
            const car = await Car.create({
                ...carData,
                status: 'pending'
            }, { transaction });

            // 2. Upload images
            let savedImages = [];
            if (imageFiles && imageFiles.length) {
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const imageUrl = `${process.env.BASE_URL}/uploads/cars/${file.filename}`;
                    const isPrimary = i === 0; // first image becomes primary
                    const img = await CarImage.create({
                        carId: car.id,
                        url: imageUrl,
                        altText: `${car.make} ${car.model}`,
                        isPrimary,
                        position: i
                    }, { transaction });
                    savedImages.push(img);
                }
            }

            // 3. Upload logbook (if provided)
            if (logbookFile) {
                const logbookUrl = `${process.env.BASE_URL}/uploads/cars/registration/${logbookFile.filename}`;
                await car.update({ logbook_url: logbookUrl }, { transaction });
            }

            // 4. Upload insurance (if provided)
            if (insuranceFile) {
                const insuranceUrl = `${process.env.BASE_URL}/uploads/cars/insurance/${insuranceFile.filename}`;
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
