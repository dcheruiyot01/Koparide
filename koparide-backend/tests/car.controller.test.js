/**
 * Car Controller Tests
 * --------------------
 * Covers major controller methods:
 *  - createCarListing (owner notification)
 *  - rentCar (renter notification)
 *  - deleteCar
 *  - approveCar / rejectCar
 *  - getPublicCars
 *
 * CarService and MailService are mocked to isolate controller logic.
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock CarService
jest.mock('../services/car.service', () => ({
    createCarListing: jest.fn(),
    uploadCarImages: jest.fn(),
    uploadInsurance: jest.fn(),
    approveCar: jest.fn(),
    rejectCar: jest.fn(),
    getPublicCars: jest.fn(),
    deleteCar: jest.fn(),
    rentCar: jest.fn(),
    returnCar: jest.fn()
}));
const CarService = require('../services/car.service');

// Mock MailService
jest.mock('../services/mail.service', () => ({
    sendEmail: jest.fn()
}));
const MailService = require('../services/mail.service');

// Import controller
const CarController = require('../controllers/car.controller');

// Setup Express app for testing
const app = express();
app.use(bodyParser.json());

// Helper to wrap controller methods with routes
function route(method, path, handler) {
    app[method](path, (req, res, next) => {
        // Inject mock user for auth context
        req.user = { id: 42, name: 'Daniel', email: 'test@example.com' };
        handler(req, res, next);
    });
}

// Register routes
route('post', '/cars', CarController.createCarListing);
route('post', '/cars/:id/rent', CarController.rentCar);
route('delete', '/cars/:id', CarController.deleteCar);
route('patch', '/admin/cars/:id/approve', CarController.approveCar);
route('patch', '/admin/cars/:id/reject', CarController.rejectCar);
route('get', '/cars', CarController.getPublicCars);

describe('CarController', () => {
    afterEach(() => jest.clearAllMocks());

    /**
     * CREATE CAR LISTING
     */
    it('✅ should create car listing and send owner notification email', async () => {
        CarService.createCarListing.mockResolvedValue({
            id: 1, make: 'Toyota', model: 'Corolla', status: 'pending'
        });

        const res = await request(app).post('/cars').send({
            make: 'Toyota', model: 'Corolla', year: 2020, pricePerDay: 40
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Pending approval');
        expect(MailService.sendEmail).toHaveBeenCalledWith(
            'test@example.com',
            'Car Listing Pending Approval',
            expect.stringContaining('Toyota Corolla')
        );
    });

    /**
     * RENT CAR
     */
    it('✅ should rent car and send renter notification email', async () => {
        CarService.rentCar.mockResolvedValue({
            id: 1, make: 'Toyota', model: 'Corolla', pricePerDay: 40, ownerId: 42
        });

        const res = await request(app).post('/cars/1/rent');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car rented successfully');
        expect(MailService.sendEmail).toHaveBeenCalledWith(
            'test@example.com',
            'Car Rental Confirmation',
            expect.stringContaining('Toyota Corolla')
        );
    });

    /**
     * DELETE CAR
     */
    it('✅ should delete car successfully', async () => {
        CarService.deleteCar.mockResolvedValue({ id: 1, is_deleted: true });

        const res = await request(app).delete('/cars/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car deleted successfully');
    });

    /**
     * APPROVE CAR
     */
    it('✅ should approve car listing', async () => {
        CarService.approveCar.mockResolvedValue({ id: 1, status: 'approved' });

        const res = await request(app).patch('/admin/cars/1/approve');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car approved successfully');
    });

    /**
     * REJECT CAR
     */
    it('✅ should reject car listing', async () => {
        CarService.rejectCar.mockResolvedValue({ id: 1, status: 'rejected' });

        const res = await request(app).patch('/admin/cars/1/reject');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car rejected successfully');
    });

    /**
     * GET PUBLIC CARS
     */
    it('✅ should return public cars', async () => {
        CarService.getPublicCars.mockResolvedValue([
            { id: 1, make: 'Toyota', status: 'approved', is_deleted: false },
            { id: 2, make: 'Honda', status: 'approved', is_deleted: false }
        ]);

        const res = await request(app).get('/cars');
        expect(res.status).toBe(200);
        expect(res.body[0].status).toBe('approved');
    });
});
