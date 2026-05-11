/**
 * Auth Service Tests (Unit Tests)
 * --------------------------------
 * Covers register, login, refresh, logout,
 * password reset, and email verification flows.
 * Dependencies are mocked to isolate business logic.
 */

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// ----- Mocks -----
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

// Mock bcrypt methods to avoid real hashing
bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
bcrypt.compare = jest.fn().mockResolvedValue(true);

// ----- Imports -----
const User = require('../models/User');
const MailService = require('../services/mail.service');
const generateResetToken = require('../utils/generateResetToken');
const {
    signAccessToken,
    generateRefreshToken,
    hashToken,
    compareToken
} = require('../utils/token');
const AuthService = require('../services/auth.service');

describe('AuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * REGISTER
     */
    describe('register', () => {
        it('should register new user and send verification email', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                id: 1,
                name: 'Daniel',
                email: 'test@example.com',
                createdAt: new Date()
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

        it('should throw error if email already exists', async () => {
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
        it('should login verified user and issue tokens', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword',
                isVerified: true,
                save: jest.fn()
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            const result = await AuthService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
        });

        it('should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);

            await expect(AuthService.login({
                email: 'missing@example.com',
                password: 'password123'
            })).rejects.toThrow('User not found');
        });

        it('should throw error if email not verified', async () => {
            User.findOne.mockResolvedValue({ isVerified: false });

            await expect(AuthService.login({
                email: 'test@example.com',
                password: 'password123'
            })).rejects.toThrow('Please verify your email before logging in');
        });

        it('should throw error if password mismatch', async () => {
            const mockUser = { password: 'hashed', isVerified: true };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await expect(AuthService.login({
                email: 'test@example.com',
                password: 'wrong'
            })).rejects.toThrow('Invalid credentials');
        });
    });

    /**
     * REFRESH TOKEN
     *
     * Note: The service hashes the incoming token (using crypto or hashToken)
     * and looks up the user by that hash. It does NOT use bcrypt.compare here.
     * Validation succeeds if a user is found; fails otherwise.
     */
    describe('refresh', () => {
        it('should issue new access and refresh tokens', async () => {
            const mockUser = {
                id: 1,
                email: 'daniel@example.com',
                refreshToken: 'stored-hash',   // the hash that is already in DB
                save: jest.fn()
            };
            // The service computes a hash from 'valid-refresh-token' and finds this user
            User.findOne.mockResolvedValue(mockUser);
            signAccessToken.mockReturnValue('new-access-token');
            generateRefreshToken.mockReturnValue('new-raw-refresh-token');
            hashToken.mockReturnValue('new-hashed-refresh-token');

            const result = await AuthService.refresh('valid-refresh-token');

            // Verify that lookup was done with SOME string (the computed hash)
            expect(User.findOne).toHaveBeenCalledWith({
                where: { refreshToken: expect.any(String) }
            });
            // The service should update the stored refresh token hash
            expect(mockUser.save).toHaveBeenCalled();
            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-raw-refresh-token'
            });
        });

        it('should throw error if refresh token is invalid (user not found)', async () => {
            // No user matches the computed hash of 'invalid-token'
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.refresh('invalid-token'))
                .rejects.toThrow('Invalid refresh token');
        });

        // Note: A separate "token comparison fails" test is redundant because
        // validation is based solely on finding a user by the hashed token.
        // If a user is found, the token is considered valid.
    });

    /**
     * LOGOUT
     */
    describe('logout', () => {
        it('should clear refresh token', async () => {
            const mockUser = { save: jest.fn() };
            const result = await AuthService.logout(mockUser);
            expect(result.message).toBe('Logged out successfully');
            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    /**
     * PASSWORD RESET
     */
    describe('createPasswordResetToken', () => {
        it('should create reset token and send email', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.createPasswordResetToken('test@example.com');

            expect(MailService.sendPasswordResetEmail).toHaveBeenCalled();
            expect(result.resetURL).toContain('/reset-password/');
        });

        it('should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.createPasswordResetToken('missing@example.com'))
                .rejects.toThrow('User not found');
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue('newHashed');

            const result = await AuthService.resetPassword('token123', 'newPass');

            expect(result.message).toBe('Password reset successful');
            expect(bcrypt.hash).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error if token invalid', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.resetPassword('badToken', 'newPass'))
                .rejects.toThrow('Token is invalid or expired');
        });
    });

    /**
     * EMAIL VERIFICATION
     */
    describe('verifyEmail', () => {
        it('should verify email successfully', async () => {
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.verifyEmail('token123');

            expect(result.message).toBe('Email verified successfully');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error if token invalid', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.verifyEmail('badToken'))
                .rejects.toThrow('Verification token is invalid or expired');
        });
    });

    describe('resendVerificationEmail', () => {
        it('should resend verification email', async () => {
            const mockUser = { save: jest.fn(), isVerified: false };
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.resendVerificationEmail('test@example.com');

            expect(MailService.sendVerificationEmail).toHaveBeenCalled();
            expect(result.message).toBe('Verification email resent');
        });

        it('should throw error if user not found', async () => {
            User.findOne.mockResolvedValue(null);
            await expect(AuthService.resendVerificationEmail('missing@example.com'))
                .rejects.toThrow('User not found');
        });

        it('should throw error if already verified', async () => {
            User.findOne.mockResolvedValue({ isVerified: true });
            await expect(AuthService.resendVerificationEmail('test@example.com'))
                .rejects.toThrow('Email already verified');
        });
    });
});