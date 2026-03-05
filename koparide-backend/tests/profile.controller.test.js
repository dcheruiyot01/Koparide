/**
 * Profile Controller Tests
 * ------------------------
 * Uses Jest + Supertest to validate controller behavior.
 * The Profile model is mocked to avoid hitting a real database.
 * Each test covers both success and failure scenarios.
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// Mock Profile model
jest.mock('../models/profile', () => ({
    findOne: jest.fn(),
    update: jest.fn()
}));
const Profile = require('../models/profile');

// Import controller
const profileController = require('../controllers/profile.controller');

// Setup Express app for testing
const app = express();
app.use(bodyParser.json());

// Fake auth middleware to simulate logged-in user
app.use((req, res, next) => {
    req.user = { id: 1 };
    next();
});

// Register routes with controller
app.get('/profile', profileController.getProfile);
app.put('/profile', profileController.updateProfile);
app.post('/profile/image', multer({ dest: 'uploads/' }).single('file'), profileController.uploadProfileImage);
app.post('/profile/license', multer({ dest: 'uploads/' }).single('file'), profileController.uploadLicenseImage);

describe('Profile Controller', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks after each test
    });

    /**
     * GET /profile
     */
    describe('GET /profile', () => {
        it('should return profile if found', async () => {
            Profile.findOne.mockResolvedValue({ id: 1, name: 'Daniel' });

            const res = await request(app).get('/profile');
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Daniel');
        });

        it('should return 404 if profile not found', async () => {
            Profile.findOne.mockResolvedValue(null);

            const res = await request(app).get('/profile');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Profile not found');
        });
    });

    /**
     * PUT /profile
     */
    describe('PUT /profile', () => {
        it('should update profile successfully', async () => {
            const mockProfile = { update: jest.fn().mockResolvedValue(true) };
            Profile.findOne.mockResolvedValue(mockProfile);

            const res = await request(app)
                .put('/profile')
                .send({ name: 'Updated Name', email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Profile updated successfully');
            expect(mockProfile.update).toHaveBeenCalledWith({
                name: 'Updated Name',
                email: 'test@example.com',
                phone: undefined
            });
        });

        it('should return 404 if profile not found', async () => {
            Profile.findOne.mockResolvedValue(null);

            const res = await request(app).put('/profile').send({ name: 'Test' });
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Profile not found');
        });
    });

    /**
     * POST /profile/image
     */
    describe('POST /profile/image', () => {
        it('should upload profile image successfully', async () => {
            const mockProfile = { update: jest.fn().mockResolvedValue(true) };
            Profile.findOne.mockResolvedValue(mockProfile);

            const res = await request(app)
                .post('/profile/image')
                .attach('file', path.join(__dirname, 'fixtures/test.png')); // small test image

            expect(res.status).toBe(200);
            expect(res.body.url).toContain('/uploads/profiles/');
        });

        it('should return 400 if no file uploaded', async () => {
            const res = await request(app).post('/profile/image');
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('No file uploaded');
        });
    });

    /**
     * POST /profile/license
     */
    describe('POST /profile/license', () => {
        it('should upload license image successfully', async () => {
            const mockProfile = { update: jest.fn().mockResolvedValue(true) };
            Profile.findOne.mockResolvedValue(mockProfile);

            const res = await request(app)
                .post('/profile/license')
                .attach('file', path.join(__dirname, 'fixtures/test.png'));

            expect(res.status).toBe(200);
            expect(res.body.url).toContain('/uploads/licenses/');
        });

        it('should return 400 if no file uploaded', async () => {
            const res = await request(app).post('/profile/license');
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('No file uploaded');
        });
    });
});
