/**
 * Car Service Tests
 * -----------------
 * Covers all major CarService methods:
 *  - createCarListing
 *  - uploadCarImages
 *  - uploadInsurance
 *  - approveCar / rejectCar
 *  - getPublicCars
 *
 * Dependencies (Car model) are mocked to isolate business logic.
 */

const Car = require('../models/Car');
const CarService = require('../services/car.service');

// Mock Car model methods
jest.mock('../models/Car', () => ({
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn()
}));

describe('CarService', () => {
    afterEach(() => jest.clearAllMocks());

    /**
     * CREATE CAR LISTING
     */
    describe('createCarListing', () => {
        it('✅ should create a car listing with status pending and default classification', async () => {
            Car.create.mockResolvedValue({
                id: 1,
                ownerId: 42,
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                pricePerDay: 40.00,
                classification: 'Saloon',
                status: 'pending'
            });

            const result = await CarService.createCarListing({
                ownerId: 42,
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                pricePerDay: 40.00
            });

            expect(Car.create).toHaveBeenCalledWith({
                ownerId: 42,
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                pricePerDay: 40.00,
                classification: 'Saloon',
                status: 'pending'
            });
            expect(result.status).toBe('pending');
        });

        it('✅ should allow explicit classification', async () => {
            Car.create.mockResolvedValue({
                id: 2,
                ownerId: 42,
                make: 'Toyota',
                model: 'RAV4',
                year: 2021,
                pricePerDay: 60.00,
                classification: 'SUV',
                status: 'pending'
            });

            const result = await CarService.createCarListing({
                ownerId: 42,
                make: 'Toyota',
                model: 'RAV4',
                year: 2021,
                pricePerDay: 60.00,
                classification: 'SUV'
            });

            expect(result.classification).toBe('SUV');
        });

        it('❌ should throw error if required fields missing', async () => {
            Car.create.mockRejectedValue(new Error('Missing required fields'));

            await expect(CarService.createCarListing({})).rejects.toThrow('Missing required fields');
        });
    });

    /**
     * UPLOAD CAR IMAGES
     */
    describe('uploadCarImages', () => {
        it('✅ should update car images', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.uploadCarImages(1, ['img1.jpg', 'img2.jpg']);

            expect(Car.findByPk).toHaveBeenCalledWith(1);
            expect(mockCar.update).toHaveBeenCalledWith({ images: ['img1.jpg', 'img2.jpg'] });
            expect(result).toBe(true);
        });

        it('❌ should throw error if car not found', async () => {
            Car.findByPk.mockResolvedValue(null);

            await expect(CarService.uploadCarImages(99, ['img.jpg']))
                .rejects.toThrow('Car not found');
        });
    });

    /**
     * UPLOAD INSURANCE
     */
    describe('uploadInsurance', () => {
        it('✅ should update insurance URL', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.uploadInsurance(1, 'insurance.pdf');

            expect(mockCar.update).toHaveBeenCalledWith({ insuranceUrl: 'insurance.pdf' });
            expect(result).toBe(true);
        });

        it('❌ should throw error if car not found', async () => {
            Car.findByPk.mockResolvedValue(null);

            await expect(CarService.uploadInsurance(99, 'insurance.pdf'))
                .rejects.toThrow('Car not found');
        });
    });

    /**
     * APPROVE / REJECT CAR
     */
    describe('approveCar', () => {
        it('✅ should approve car listing', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.approveCar(1);

            expect(mockCar.update).toHaveBeenCalledWith({ status: 'approved' });
            expect(result).toBe(true);
        });

        it('❌ should throw error if car not found', async () => {
            Car.findByPk.mockResolvedValue(null);

            await expect(CarService.approveCar(99)).rejects.toThrow('Car not found');
        });
    });

    describe('rejectCar', () => {
        it('✅ should reject car listing', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.rejectCar(1);

            expect(mockCar.update).toHaveBeenCalledWith({ status: 'rejected' });
            expect(result).toBe(true);
        });
    });

    /**
     * GET PUBLIC CARS
     */
    describe('getPublicCars', () => {
        it('✅ should return only approved cars', async () => {
            Car.findAll.mockResolvedValue([
                { id: 1, make: 'Toyota', status: 'approved', is_deleted: false },
                { id: 2, make: 'Honda', status: 'approved', is_deleted: false }
            ]);

            const result = await CarService.getPublicCars();

            expect(Car.findAll).toHaveBeenCalledWith({ where: { status: 'approved',is_deleted: false } });
            expect(result.length).toBe(2);
            expect(result[0].status).toBe('approved');
            expect(result[0].is_deleted).toBe(false);
        });
    });

    describe('CarService.deleteCar', () => {
        it('✅ should mark car as deleted if not rented', async () => {
            const mockCar = { rented_to: null, update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.deleteCar(1);

            expect(mockCar.update).toHaveBeenCalledWith({ is_deleted: true });
            expect(result).toBe(true);
        });

        it('❌ should throw error if car is rented', async () => {
            const mockCar = { rented_to: 99, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);

            await expect(CarService.deleteCar(1)).rejects.toThrow('Cannot delete car while rented');
        });
    });

    describe('CarService.rentCar', () => {
        it('✅ should assign renter to car', async () => {
            const mockCar = { is_deleted: false, rented_to: null, update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.rentCar(1, 99);

            expect(mockCar.update).toHaveBeenCalledWith({ rented_to: 99 });
            expect(result).toBe(true);
        });

        it('❌ should throw error if car already rented', async () => {
            const mockCar = { is_deleted: false, rented_to: 88, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);

            await expect(CarService.rentCar(1, 99)).rejects.toThrow('Car is already rented');
        });

        it('❌ should throw error if car is deleted', async () => {
            const mockCar = { is_deleted: true, rented_to: null, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);

            await expect(CarService.rentCar(1, 99)).rejects.toThrow('Car is deleted and cannot be rented');
        });
    });

    describe('CarService.returnCar', () => {
        it('✅ should clear rented_to when car returned', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);

            const result = await CarService.returnCar(1);

            expect(mockCar.update).toHaveBeenCalledWith({ rented_to: null });
            expect(result).toBe(true);
        });
    });
});
