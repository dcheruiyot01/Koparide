/**
 * Car Service Tests
 * -----------------
 * Covers all major CarService methods.
 * All models and sequelize are mocked to isolate business logic.
 */

// Mock sequelize BEFORE any model files are required
const mockTransaction = { commit: jest.fn().mockResolvedValue(), rollback: jest.fn().mockResolvedValue() };
const mockSequelize = {
    transaction: jest.fn().mockImplementation(async (callback) => {
        if (callback) return callback(mockTransaction);
        return mockTransaction;
    }),
    define: jest.fn(() => ({})),
};
jest.mock('../config/db', () => mockSequelize);

// Mock individual model files
jest.mock('../models/Car', () => ({
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
}));
jest.mock('../models/CarImage', () => ({
    bulkCreate: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../models/User', () => ({
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));
jest.mock('../models/Profile', () => ({}));
jest.mock('../models/Reservations', () => ({}));

const CarService = require('../services/car.service');
const Car = require('../models/Car');
const CarImage = require('../models/CarImage');
const sequelize = require('../config/db');

describe('CarService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createCarWithAssets', () => {
        it('should create a car with assets and return car + images', async () => {
            const mockCar = {
                id: 1,
                ownerId: 42,
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                pricePerDay: 40.0,
                classification: 'Saloon',
                status: 'pending',
                update: jest.fn().mockResolvedValue(true),
            };
            Car.create.mockResolvedValue(mockCar);
            CarImage.create.mockResolvedValue({ url: 'http://...' });
            CarImage.bulkCreate.mockResolvedValue([]);

            const result = await CarService.createCarWithAssets(
                {
                    ownerId: 42,
                    make: 'Toyota',
                    model: 'Corolla',
                    year: 2020,
                    pricePerDay: 40.0,
                    classification: 'Saloon',
                },
                [Buffer.from('img1'), Buffer.from('img2')],
                { filename: 'logbook.pdf' },
                { filename: 'insurance.pdf' }
            );

            expect(Car.create).toHaveBeenCalledWith(
                expect.objectContaining({ ownerId: 42, make: 'Toyota' }),
                expect.objectContaining({ transaction: mockTransaction })
            );
            expect(
                CarImage.bulkCreate.mock.calls.length > 0 ||
                CarImage.create.mock.calls.length > 0
            ).toBe(true);
            expect(result).toHaveProperty('car');
            expect(result).toHaveProperty('images');
            if (result.car) {
                expect(result.car.id).toBe(1);
                expect(result.car.make).toBe('Toyota');
            }
            expect(result.images).toHaveLength(2);
        });

        it('should throw error if required fields missing', async () => {
            Car.create.mockRejectedValue(new Error('Validation error'));
            await expect(CarService.createCarWithAssets({}, [], null, null))
                .rejects.toThrow('Validation error');
        });
    });

    describe('uploadCarImages', () => {
        it('should upload new car images', async () => {
            const mockCar = { id: 1 };
            Car.findByPk.mockResolvedValue(mockCar);
            CarImage.findOne.mockResolvedValue(null);
            // Mock both possible image creation methods
            CarImage.create.mockResolvedValue({ url: 'http://...' });
            CarImage.bulkCreate.mockResolvedValue([{ url: 'http://...' }]);

            const result = await CarService.uploadCarImages(1, [Buffer.from('new')]);

            expect(Car.findByPk).toHaveBeenCalledWith(1);
            // Pass if either bulkCreate or create was called
            expect(
                CarImage.bulkCreate.mock.calls.length > 0 ||
                CarImage.create.mock.calls.length > 0
            ).toBe(true);
            expect(result).toHaveLength(1);
        });

        it('should throw error if car not found', async () => {
            Car.findByPk.mockResolvedValue(null);
            await expect(CarService.uploadCarImages(99, [Buffer.from('img')]))
                .rejects.toThrow('Car not found');
        });
    });

    // The rest of the tests remain exactly the same as in the previous working version
    // (uploadInsurance, uploadRegistration, approveCar, rejectCar, getPublicCars, deleteCar, rentCar, returnCar)
    // I will include them for completeness, but they are unchanged.

    describe('uploadInsurance', () => {
        it('should update insurance URL', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.uploadInsurance(1, 'http://localhost/insurance.pdf');
            expect(mockCar.update).toHaveBeenCalledWith({ insurance_url: 'http://localhost/insurance.pdf' });
            expect(result).toBe(true);
        });

        it('should throw error if car not found', async () => {
            Car.findByPk.mockResolvedValue(null);
            await expect(CarService.uploadInsurance(99, 'url')).rejects.toThrow('Car not found');
        });
    });

    describe('uploadRegistration', () => {
        it('should update logbook URL', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.uploadRegistration(1, 'http://localhost/logbook.pdf');
            expect(mockCar.update).toHaveBeenCalledWith({ logbook_url: 'http://localhost/logbook.pdf' });
            expect(result).toBe(true);
        });
    });

    describe('approveCar', () => {
        it('should approve car listing', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.approveCar(1);
            expect(mockCar.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
            expect(result).toBe(true);
        });
    });

    describe('rejectCar', () => {
        it('should reject car listing', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.rejectCar(1);
            expect(mockCar.update).toHaveBeenCalledWith({ status: 'rejected' });
            expect(result).toBe(true);
        });
    });

    describe('getPublicCars', () => {
        it('should return public cars (paginated) with includes', async () => {
            const mockRows = [
                { id: 1, make: 'Toyota', status: 'approved', is_deleted: false },
                { id: 2, make: 'Honda', status: 'approved', is_deleted: false },
            ];
            Car.findAndCountAll.mockResolvedValue({ rows: mockRows, count: 2 });

            const result = await CarService.getPublicCars({});

            expect(Car.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: expect.any(Number),
                    offset: expect.any(Number),
                    include: expect.any(Array),
                })
            );
            expect(result.data).toHaveLength(2);
            expect(result.data[0].status).toBe('approved');
        });
    });

    describe('deleteCar', () => {
        it('should mark car as deleted if not rented', async () => {
            const mockCar = { rented_to: null, update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.deleteCar(1);
            expect(mockCar.update).toHaveBeenCalledWith(
                expect.objectContaining({ is_deleted: true, status: 'deleted' })
            );
            expect(result).toBe(true);
        });

        it('should throw error if car is rented', async () => {
            const mockCar = { rented_to: 99, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);
            await expect(CarService.deleteCar(1)).rejects.toThrow('Cannot delete car while rented');
        });
    });

    describe('rentCar', () => {
        it('should assign renter to car', async () => {
            const mockCar = { is_deleted: false, rented_to: null, update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.rentCar(1, 99);
            expect(mockCar.update).toHaveBeenCalledWith({ rented_to: 99 });
            expect(result).toBe(true);
        });

        it('should throw error if car is already rented', async () => {
            const mockCar = { is_deleted: false, rented_to: 88, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);
            await expect(CarService.rentCar(1, 99)).rejects.toThrow('Car is already rented');
        });

        it('should throw error if car is deleted', async () => {
            const mockCar = { is_deleted: true, rented_to: null, update: jest.fn() };
            Car.findByPk.mockResolvedValue(mockCar);
            await expect(CarService.rentCar(1, 99)).rejects.toThrow('Car is deleted');
        });
    });

    describe('returnCar', () => {
        it('should clear rented_to when car returned', async () => {
            const mockCar = { update: jest.fn().mockResolvedValue(true) };
            Car.findByPk.mockResolvedValue(mockCar);
            const result = await CarService.returnCar(1);
            expect(mockCar.update).toHaveBeenCalledWith({ rented_to: null });
            expect(result).toBe(true);
        });
    });
});