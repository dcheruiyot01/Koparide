/**
 * Auth Service Tests
 * ------------------
 * Covers register, login, googleOAuth, refresh, logout,
 * password reset, and email verification flows.
 * Dependencies (User model, MailService, bcrypt, jwt, etc.)
 * are mocked to isolate business logic.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

jest.mock('../models/User', () => ({
    findOne: jest.fn(),
    create: jest.fn()
}));
jest.mock('../services/mail.service', () => ({
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn()
}));
jest.mock('../utils/generateResetToken', () => jest.fn(() => ({
    resetToken: 'rawToken123',
    hashedToken: 'hashedToken123'
})));
jest.mock('../utils/token', () => ({
    signAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    hashToken: jest.fn(() => 'hashed-refresh-token'),
    compareToken: jest.fn(() => true)
}));

const User = require('../models/User');
const MailService = require('../services/mail.service');
const generateResetToken = require('../utils/generateResetToken');
const { signAccessToken, generateRefreshToken, hashToken, compareToken } = require('../utils/token');
const AuthService = require('../services/auth.service');

describe('AuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * REGISTER
     */
    describe('register', () => {
        it('✅ should register new user and send verification email', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                id: 1, name: 'Daniel', email: 'test@example.com', createdAt: new Date()
            });

            const result = await AuthService.register({
                name: 'Daniel',
                email: 'test@example.com',
                password: 'password123'
            });

            expect(User.create).toHaveBeenCalled();
            expect(MailService.sendVerificationEmail).toHaveBeenCalled();
            expect(result.user.email).toBe('test@example.com');
            expect(result.token).toBe('access-token');
        });

        it('❌ should throw error if email already exists', async () => {
            User.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

            await expect(AuthService.register({
                name: 'Daniel',
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Email already exists');
        });
    });

    /**
     * LOGIN
     */
    describe('login', () => {
        it('✅ should login verified user and issue tokens', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: await bcrypt.hash('password123', 10),
                isVerified: true,
                save: jest.fn()
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(true);

            const result = await AuthService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
        });

        it('❌ should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            await expect(AuthService.login({
                email: 'missing@example.com',
                password: 'password123'
            })).rejects.toThrow('User not found');
        });

        it('❌ should throw error if email not verified', async () => {
            User.findOne.mockResolvedValue({ isVerified: false });

            await expect(AuthService.login({
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Please verify your email before logging in');
        });

        it('❌ should throw error if password mismatch', async () => {
            const mockUser = { password: 'hashed', isVerified: true };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(false);

            await expect(AuthService.login({
                email: 'test@example.com',
                password: 'wrong'
            })).rejects.toThrow('Invalid credentials');
        });
    });

    /**
     * REFRESH TOKEN
     */
    describe('refresh', () => {
        it('✅ should issue new access token if refresh token valid', async () => {
            const mockUser = {
                id: 1,
                refreshToken: 'hashed-refresh-token',
                refreshTokenExpires: new Date(Date.now() + 10000)
            };
            User.findOne.mockResolvedValue(mockUser);
            compareToken.mockResolvedValue(true);

            const result = await AuthService.refresh('refresh-token');
            expect(result).toBe('access-token');
        });

        it('❌ should throw error if no token provided', async () => {
            await expect(AuthService.refresh(null)).rejects.toThrow('No refresh token provided');
        });
    });

    /**
     * LOGOUT
     */
    describe('logout', () => {
        it('✅ should clear refresh token', async () => {
            const mockUser = { save: jest.fn() };
            const result = await AuthService.logout(mockUser);
            expect(result.message).toBe('Logged out successfully');
        });
    });

    /**
     * PASSWORD RESET
     */
    describe('createPasswordResetToken', () => {
        it('✅ should create reset token and send email', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.createPasswordResetToken('test@example.com');
            expect(MailService.sendPasswordResetEmail).toHaveBeenCalled();
            expect(result.resetURL).toContain('/reset-password/');
        });

        it('❌ should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.createPasswordResetToken('missing@example.com'))
                .rejects.toThrow('User not found');
        });
    });

    describe('resetPassword', () => {
        it('✅ should reset password successfully', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.hash = jest.fn().mockResolvedValue('newHashed');

            const result = await AuthService.resetPassword('token123', 'newPass');
            expect(result.message).toBe('Password reset successful');
        });

        it('❌ should throw error if token invalid', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.resetPassword('badToken', 'newPass'))
                .rejects.toThrow('Token is invalid or expired');
        });
    });

    /**
     * EMAIL VERIFICATION
     */
    describe('verifyEmail', () => {
        it('✅ should verify email successfully', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.verifyEmail('token123');
            expect(result.message).toBe('Email verified successfully');
        });

        it('❌ should throw error if token invalid', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.verifyEmail('badToken'))
                .rejects.toThrow('Verification token is invalid or expired');
        });
    });

    describe('resendVerificationEmail', () => {
        it('✅ should resend verification email', async () => {
            const mockUser = { save: jest.fn(), isVerified: false };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.resendVerificationEmail('test@example.com');
            expect(MailService.sendVerificationEmail).toHaveBeenCalled();
            expect(result.message).toBe('Verification email resent');
        });

        it('❌ should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.resendVerificationEmail('missing@example.com'))
                .rejects.toThrow('User not found');
        });

        it('❌ should throw error if already verified', async () => {
            User.findOne.mockResolvedValue({ isVerified: true });
            await expect(AuthService.resendVerificationEmail('test@example.com'))
                .rejects.toThrow('Email already verified');
        });
    });
});
