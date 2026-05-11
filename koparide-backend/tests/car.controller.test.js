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

// Mock CarService with the actual methods used by the controller
jest.mock('../services/car.service', () => ({
    createCarWithAssets: jest.fn(),   // renamed from createCarListing
    uploadCarImages: jest.fn(),
    uploadInsurance: jest.fn(),
    uploadRegistration: jest.fn(),    // used in updateCarListing, but not in these tests
    approveCar: jest.fn(),
    rejectCar: jest.fn(),
    getPublicCars: jest.fn(),
    deleteCar: jest.fn(),
    rentCar: jest.fn(),
    returnCar: jest.fn(),
    updateCarListing: jest.fn(),
}));
const CarService = require('../services/car.service');

// Mock MailService with both sendMail (object style) and sendEmail (arguments style)
jest.mock('../services/mail.service', () => ({
    sendMail: jest.fn(),
    sendEmail: jest.fn(),
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
        // Provide empty files object to avoid undefined errors in the controller
        req.files = { images: [], logbook: [], insurance: [] };
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
    it('should create car listing and send owner notification email', async () => {
        const mockCar = { id: 1, make: 'Toyota', model: 'Corolla', status: 'pending' };
        const mockImages = [
            { url: 'http://localhost/uploads/cars/images/img1.jpg' },
            { url: 'http://localhost/uploads/cars/images/img2.jpg' }
        ];
        CarService.createCarWithAssets.mockResolvedValue({ car: mockCar, images: mockImages });

        const res = await request(app).post('/cars').send({
            make: 'Toyota', model: 'Corolla', year: 2020, pricePerDay: 40
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('submitted successfully');
        expect(MailService.sendMail).toHaveBeenCalledWith({
            to: 'test@example.com',
            subject: 'Car Listing Pending Approval',
            html: expect.stringContaining('Toyota Corolla')
        });
    });

    /**
     * RENT CAR
     */
    it('should rent car and send renter notification email', async () => {
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
    it('should delete car successfully', async () => {
        CarService.deleteCar.mockResolvedValue({ id: 1, is_deleted: true });

        const res = await request(app).delete('/cars/1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car deleted successfully');
    });

    /**
     * APPROVE CAR
     */
    it('should approve car listing', async () => {
        CarService.approveCar.mockResolvedValue({ id: 1, status: 'approved' });

        const res = await request(app).patch('/admin/cars/1/approve');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car approved successfully');
    });

    /**
     * REJECT CAR
     */
    it('should reject car listing', async () => {
        CarService.rejectCar.mockResolvedValue({ id: 1, status: 'rejected' });

        const res = await request(app).patch('/admin/cars/1/reject');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Car rejected successfully');
    });

    /**
     * GET PUBLIC CARS
     */
    it('should return public cars', async () => {
        // The controller passes query parameters to the service
        CarService.getPublicCars.mockResolvedValue([
            { id: 1, make: 'Toyota', status: 'approved', is_deleted: false },
            { id: 2, make: 'Honda', status: 'approved', is_deleted: false }
        ]);

        const res = await request(app).get('/cars');
        expect(res.status).toBe(200);
        expect(res.body[0].status).toBe('approved');
    });
});