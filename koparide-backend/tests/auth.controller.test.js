/**
 * Authentication Controller Tests
 * -------------------------------
 * Uses Jest + Supertest to validate controller behavior.
 * AuthService is mocked to isolate controller logic.
 * Focuses on response codes, JSON payloads, and cookie handling.
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Mock AuthService
jest.mock('../services/auth.service', () => ({
    register: jest.fn(),
    login: jest.fn(),
    googleOAuth: jest.fn(),
    createPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn()
}));
const AuthService = require('../services/auth.service');

// Import controller
const AuthController = require('../controllers/auth.controller');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());

// Helper to wrap controller methods with route
function route(method, path, handler) {
    app[method](path, (req, res, next) => handler(req, res, next));
}

// Register routes
route('post', '/register', AuthController.register);
route('post', '/login', AuthController.login);
route('post', '/google', AuthController.googleOAuth);
route('post', '/forgot', AuthController.forgotPassword);
route('post', '/reset/:token', AuthController.resetPassword);
route('get', '/verify/:token', AuthController.verifyEmail);
route('post', '/resend', AuthController.resendVerificationEmail);
route('post', '/refresh', AuthController.refresh);
route('post', '/logout', AuthController.logout);

describe('AuthController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * REGISTER
     */
    it('✅ should register user successfully', async () => {
        AuthService.register.mockResolvedValue({ user: { id: 1 }, token: 'access' });

        const res = await request(app).post('/register').send({ email: 'test@example.com', password: '123' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
        expect(res.body.user.id).toBe(1);
    });

    /**
     * LOGIN
     */
    it('✅ should login user and set refresh token cookie', async () => {
        AuthService.login.mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: 1 }
        });

        const res = await request(app).post('/login').send({ email: 'test@example.com', password: '123' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.token).toBe('access-token');
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=refresh-token/);
    });

    /**
     * GOOGLE OAUTH
     */
    it('✅ should login via Google and set cookie', async () => {
        AuthService.googleOAuth.mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: 1 }
        });

        const res = await request(app).post('/google').send({ credential: 'google-id-token' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Google login successful');
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=refresh-token/);
    });

    /**
     * FORGOT PASSWORD
     */
    it('✅ should generate password reset link', async () => {
        AuthService.createPasswordResetToken.mockResolvedValue({ resetURL: 'http://reset' });

        const res = await request(app).post('/forgot').send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password reset link generated');
        expect(res.body.resetURL).toBe('http://reset');
    });

    /**
     * RESET PASSWORD
     */
    it('✅ should reset password successfully', async () => {
        AuthService.resetPassword.mockResolvedValue({ message: 'Password reset successful' });

        const res = await request(app).post('/reset/token123').send({ password: 'newPass' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password reset successful');
    });

    /**
     * VERIFY EMAIL
     */
    it('✅ should verify email successfully', async () => {
        AuthService.verifyEmail.mockResolvedValue({ message: 'Email verified successfully' });

        const res = await request(app).get('/verify/token123');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Email verified successfully');
    });

    /**
     * RESEND VERIFICATION EMAIL
     */
    it('✅ should resend verification email', async () => {
        AuthService.resendVerificationEmail.mockResolvedValue({ message: 'Verification email resent' });

        const res = await request(app).post('/resend').send({ email: 'test@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Verification email resent');
    });

    /**
     * REFRESH TOKEN
     */
    it('✅ should refresh access token', async () => {
        AuthService.refresh.mockResolvedValue('new-access-token');

        const res = await request(app).post('/refresh').set('Cookie', 'refreshToken=refresh-token');

        expect(res.status).toBe(200);
        expect(res.body.token).toBe('new-access-token');
    });

    /**
     * LOGOUT
     */
    it('✅ should logout and clear cookie', async () => {
        AuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

        const res = await request(app).post('/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Logged out successfully');
        expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=;/); // cookie cleared
    });
});
