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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load test environment (JWT_SECRET, DB config)
require('./setup/test-env');

// Mock Nodemailer globally
jest.mock('nodemailer');

describe('Auth API', () => {
  let server;

  beforeAll(async () => {
    // Sync models with test database (force true only once)
    await User.sync({ force: true });
    // Start the server on a random port
    server = app.listen(0);
  });

  afterAll(async () => {
    // Only close the server – let the global teardown handle the database
    await server.close();
  });

  beforeEach(async () => {
    // Clear users table before each test (but keep schema)
    await User.destroy({ where: {}, truncate: true });
    // Reset nodemailer mock
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

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('verifyURL');
    expect(res.body.user.email).toBe('daniel@example.com');

    const userInDb = await User.findOne({ where: { email: 'daniel@example.com' } });
    expect(userInDb).not.toBeNull();
    expect(userInDb.password).not.toBe('password123');
    expect(userInDb.emailVerificationToken).not.toBeNull();

    const sendMailMock = nodemailer.createTransport().sendMail;
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('POST /auth/register → rejects duplicate email', async () => {
    await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: 'hashed',
      isVerified: false
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
    expect(res.body.message).toMatch(/verify your email/i);
  });

  test('POST /auth/login → logs in verified user with correct credentials', async () => {
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
          password: 'password123'
        });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('daniel@example.com');
  });

  test('POST /auth/login → rejects wrong password', async () => {
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
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('POST /auth/login → rejects non-existent email', async () => {
    const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'password123'
        });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/no account found/i);
  });

  // -------------------------------------------------------------
  // AUTH ME TESTS
  // -------------------------------------------------------------

  test('GET /auth/me → returns logged-in user when token is valid', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Daniel',
      email: 'daniel@example.com',
      password: hashed,
      isVerified: true
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('daniel@example.com');
  });

  test('GET /auth/me → returns 401 when token is missing', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test('GET /auth/me → returns 401 when token is invalid', async () => {
    const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
    expect(res.statusCode).toBe(401);
  });
});