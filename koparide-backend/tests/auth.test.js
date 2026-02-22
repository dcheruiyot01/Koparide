/**
 * Auth API Integration Tests
 *
 * Covers:
 *  - Registration
 *  - Duplicate email
 *  - Login (verified + unverified)
 *  - Wrong password
 *  - Non-existent email
 *  - /auth/me protected route
 */

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Load test DB + env
require('./setup/db');
require('./setup/test-env');

// Mock Nodemailer
jest.mock('nodemailer');

describe('Auth API', () => {
  beforeEach(async () => {
    await User.sync({ force: true });
    nodemailer.createTransport().sendMail.mockClear();
  });

  // -------------------------------------------------------------
  // REGISTER TESTS
  // -------------------------------------------------------------

  test('POST /auth/register → creates a new user and sends verification email', async () => {
    const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Daniel',
          email: 'daniel@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(201);

    // Response shape
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('verifyURL');

    expect(res.body.user.email).toBe('daniel@example.com');

    // User exists in DB
    const userInDb = await User.findOne({ where: { email: 'daniel@example.com' } });
    expect(userInDb).not.toBeNull();

    // Password must be hashed
    expect(userInDb.password).not.toBe('password123');

    // Email verification token stored
    expect(userInDb.emailVerificationToken).not.toBeNull();

    // Nodemailer was called
    const sendMailMock = nodemailer.createTransport().sendMail;
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('POST /auth/register → rejects duplicate email', async () => {
    await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: 'hashed'
    });

    const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Daniel',
          email: 'daniel@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email.*exists/i);
  });

  // -------------------------------------------------------------
  // LOGIN TESTS
  // -------------------------------------------------------------

  test('POST /auth/login → rejects unverified user', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);

    await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: hashed,
      isVerified: false
    });

    const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'daniel@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/verify/i);
  });

  test('POST /auth/login → logs in verified user with correct credentials', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);

    const user = await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: hashed,
      isVerified: true
    });

    const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'daniel@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /auth/login → rejects wrong password', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);

    await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: hashed,
      isVerified: true
    });

    const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'daniel@example.com',
          password: 'wrongpass'
        });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test('POST /auth/login → rejects non-existent email', async () => {
    const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  // -------------------------------------------------------------
  // AUTH ME TEST
  // -------------------------------------------------------------

  test('GET /auth/me → returns logged-in user when token is valid', async () => {
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);

    const user = await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: hashed,
      isVerified: true
    });
    user.isVerified = true;
    await user.save();

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('daniel@example.com');
  });
});
