/**
 * Car Service
 * -------------------------
 * Handles business logic for car listings.
 */

const Car = require('../models/Car');

module.exports = {
    async createCarListing(data) {
        const payload = {
            ...data,
            classification: data.classification || 'Saloon',
            status: 'pending'
        };
        return Car.create(payload);
    },

    async uploadCarImages(carId, images) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        return car.update({ images });
    },

    async uploadInsurance(carId, insuranceUrl) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        return car.update({ insuranceUrl });
    },

    async approveCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        return car.update({ status: 'approved' });
    },

    async rejectCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        return car.update({ status: 'rejected' });
    },

    async getPublicCars() {
        return Car.findAll({ where: { status: 'approved', is_deleted: false } });
    },

    /**
     * Soft delete a car listing (owner removes car).
     * Prevent deletion if currently rented.
     */
    async deleteCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');

        if (car.rented_to) {
            throw new Error('Cannot delete car while rented');
        }

        return car.update({ is_deleted: true });
    },

    /**
     * Assign a renter to a car (when rented).
     */
    async rentCar(carId, renterId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        if (car.is_deleted) throw new Error('Car is deleted and cannot be rented');
        if (car.rented_to) throw new Error('Car is already rented');

        return car.update({ rented_to: renterId });
    },

    /**
     * Clear renter when car is returned.
     */
    async returnCar(carId) {
        const car = await Car.findByPk(carId);
        if (!car) throw new Error('Car not found');
        return car.update({ rented_to: null });
    }
};
