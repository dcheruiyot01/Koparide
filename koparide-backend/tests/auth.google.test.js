/**
 * Google OAuth Authentication Tests
 *
 * These tests verify:
 *  - Google ID token verification is handled correctly
 *  - Users are created or linked properly
 *  - Refresh tokens are generated and saved
 *  - Access tokens are returned
 *  - Errors are thrown for invalid Google tokens
 *
 * IMPORTANT:
 *  - We NEVER call Google's real servers.
 *  - We mock google-auth-library's OAuth2Client.verifyIdToken().
 */

/**
 * Google OAuth Authentication Tests (Production Ready)
 *
 * Key idea:
 *  - We mock google-auth-library BEFORE importing AuthService
 *  - We manually create a mock OAuth2Client instance
 */

jest.mock('google-auth-library', () => {
    const mockVerifyIdToken = jest.fn();

    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return { verifyIdToken: mockVerifyIdToken };
        }),
        __mockVerifyIdToken: mockVerifyIdToken
    };
});

// Now import AFTER the mock is set up
const { __mockVerifyIdToken: mockVerify } = require('google-auth-library');
const AuthService = require('../services/auth.service');
const User = require('../models/User');

describe('Google OAuth Login', () => {
    beforeEach(async () => {
        await User.destroy({ where: {} });
        mockVerify.mockReset();
    });

    test('should create a new user and return tokens for valid Google token', async () => {
        mockVerify.mockResolvedValue({
            getPayload: () => ({
                sub: 'google123',
                email: 'test@example.com',
                name: 'Test User'
            })
        });

        const result = await AuthService.googleOAuth('fake-id-token');

        expect(result.user.email).toBe('test@example.com');
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();

        const user = await User.findOne({ where: { email: 'test@example.com' } });
        expect(user.googleId).toBe('google123');
        expect(user.authProvider).toBe('google');
        expect(user.isVerified).toBe(true);
    });

    test('should link Google account to existing email user', async () => {
        const existing = await User.create({
            name: 'Existing User',
            email: 'existing@example.com',
            password: 'hashed',
            isVerified: false
        });

        mockVerify.mockResolvedValue({
            getPayload: () => ({
                sub: 'google999',
                email: 'existing@example.com',
                name: 'Existing User'
            })
        });

        await AuthService.googleOAuth('fake-id-token');

        const updated = await User.findByPk(existing.id);

        expect(updated.googleId).toBe('google999');
        expect(updated.authProvider).toBe('google');
        expect(updated.isVerified).toBe(true);
    });

    test('should throw error for invalid Google token', async () => {
        mockVerify.mockRejectedValue(new Error('Invalid token'));

        await expect(AuthService.googleOAuth('bad-token'))
            .rejects
            .toThrow('Invalid token');
    });

    test('should save hashed refresh token to user', async () => {
        mockVerify.mockResolvedValue({
            getPayload: () => ({
                sub: 'google123',
                email: 'test@example.com',
                name: 'Test User'
            })
        });

        await AuthService.googleOAuth('fake-id-token');

        const user = await User.findOne({ where: { email: 'test@example.com' } });

        expect(user.refreshToken).not.toBeNull();
        expect(user.refreshTokenExpires).not.toBeNull();
    });
});
