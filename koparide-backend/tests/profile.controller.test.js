/**
 * Profile Controller Tests
 * ------------------------
 * Uses Jest + Supertest to validate controller behavior.
 * Profile and User models are mocked.
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

// Mock models
jest.mock('../models/profile', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
}));
jest.mock('../models/User', () => ({
    findByPk: jest.fn()
}));

const Profile = require('../models/profile');
const User = require('../models/User');
const profileController = require('../controllers/profile.controller');

// Setup Express app for testing
const app = express();
app.use(bodyParser.json());

// Fake auth middleware
app.use((req, res, next) => {
    req.user = { id: 1 };
    next();
});

// Register routes
app.get('/profile', profileController.getProfile);
app.put('/profile', profileController.updateProfile);
app.post('/profile/image', multer({ dest: 'uploads/' }).single('file'), profileController.uploadProfileImage);
app.post('/profile/license', multer({ dest: 'uploads/' }).single('file'), profileController.uploadLicenseImage);

describe('Profile Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * GET /profile
     */
    describe('GET /profile', () => {
        it('should return profile if found (wrapped in success:true)', async () => {
            const mockProfile = {
                userid: 1,
                firstName: 'Daniel',
                lastName: 'Cheruiyot',
                createdAt: new Date(),
            };
            const mockUser = { id: 1, email: 'daniel@example.com' };

            Profile.findOne.mockResolvedValue(mockProfile);
            User.findByPk.mockResolvedValue(mockUser);

            const res = await request(app).get('/profile');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.name).toBe('Daniel Cheruiyot');
            expect(res.body.user.email).toBe('daniel@example.com');
        });

        it('should auto-create profile if not found and return raw profile (no wrapper)', async () => {
            // First findOne returns null
            Profile.findOne.mockResolvedValueOnce(null);
            // Then create returns a new profile
            const newProfile = { userid: 1, createdAt: new Date(), updatedAt: new Date() };
            Profile.create.mockResolvedValue(newProfile);

            const res = await request(app).get('/profile');
            expect(res.status).toBe(200);
            // Because the controller returns `res.json(profile)` raw, we expect the profile object directly
            expect(res.body.userid).toBe(1);
            expect(Profile.create).toHaveBeenCalledWith({ userid: 1 });
            // It should NOT have a `success` field
            expect(res.body.success).toBeUndefined();
        });
    });

    /**
     * PUT /profile
     */
    describe('PUT /profile', () => {
        it('should update profile successfully', async () => {
            const existingProfile = {
                userid: 1,
                firstName: 'Old',
                lastName: 'Name',
                update: jest.fn().mockResolvedValue(true)
            };
            // First findOne returns the existing profile
            Profile.findOne.mockResolvedValueOnce(existingProfile);

            // After update, controller fetches again – this must return the updated data
            const updatedProfile = {
                userid: 1,
                firstName: 'Daniel',
                lastName: 'Updated',
                createdAt: new Date(),
                phoneNumber: '+254700000000'
            };
            Profile.findOne.mockResolvedValueOnce(updatedProfile);

            const mockUser = { id: 1, email: 'daniel@example.com' };
            User.findByPk.mockResolvedValue(mockUser);

            const res = await request(app)
                .put('/profile')
                .send({
                    firstName: 'Daniel',
                    lastName: 'Updated',
                    phoneNumber: '+254700000000'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profile updated successfully');
            expect(res.body.user.name).toBe('Daniel Updated');
            expect(existingProfile.update).toHaveBeenCalledWith({
                firstName: 'Daniel',
                lastName: 'Updated',
                phoneNumber: '+254700000000'
            });
        });

        it('should return 400 if no valid fields to update', async () => {
            const existingProfile = { userid: 1, update: jest.fn() };
            Profile.findOne.mockResolvedValue(existingProfile);

            // Send a field that is NOT in UPDATABLE_FIELDS (e.g., 'email' or 'name')
            const res = await request(app)
                .put('/profile')
                .send({ name: 'Test Name', email: 'test@example.com' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('No valid fields to update');
        });

        it('should return 404 if profile not found', async () => {
            Profile.findOne.mockResolvedValue(null);

            const res = await request(app)
                .put('/profile')
                .send({ firstName: 'Daniel' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
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
                .attach('file', Buffer.from('dummy image'), 'test.png');

            expect(res.status).toBe(200);
            expect(res.body.url).toContain('/uploads/profiles/');
            expect(mockProfile.update).toHaveBeenCalled();
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
                .attach('file', Buffer.from('dummy image'), 'license.png');

            expect(res.status).toBe(200);
            expect(res.body.url).toContain('/uploads/licenses/');
            expect(mockProfile.update).toHaveBeenCalled();
        });

        it('should return 400 if no file uploaded', async () => {
            const res = await request(app).post('/profile/license');
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('No file uploaded');
        });
    });
});