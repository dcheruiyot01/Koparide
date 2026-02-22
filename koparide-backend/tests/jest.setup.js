// Load environment variables from .env (if needed during tests)
require('dotenv').config();

// Import the Sequelize instance (this will use sqlite::memory: when NODE_ENV=test)
const sequelize = require('../config/db');

// Import all models so Sequelize knows what to sync
const User = require('../models/User');

/**
 * beforeAll()
 * ------------
 * Jest runs this function ONCE before any test starts.
 * We use it to:
 *   1. Authenticate the DB connection
 *   2. Sync all models (force: true drops & recreates tables)
 * This ensures every test starts with a clean, isolated database.
 */
beforeAll(async () => { 
  await sequelize.authenticate();     // Confirm DB connection works
  await sequelize.sync({ force: true }); // Recreate all tables fresh
});

/**
 * afterAll()
 * -----------
 * Jest runs this function ONCE after all tests finish.
 * We close the DB connection to avoid open handles
 * that cause Jest to hang or print warnings.
 */
afterAll(async () => {
  await sequelize.close(); // Clean shutdown of the in-memory DB
});

