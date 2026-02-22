const request = require('supertest');
const app = require('../app');

describe('Logout Endpoint', () => {
    test('returns successful logout message', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            message: 'Logged out successfully'
        });
    });
});
