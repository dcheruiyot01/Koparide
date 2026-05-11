/**
 * Server Entry Point
 *
 * Handles:
 *  - Database connection (with retries)
 *  - Model syncing
 *  - Starting the HTTP server
 */

require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db'); // your Sequelize instance

/**
 * Wait for database to become available (retry on ECONNREFUSED)
 */
async function waitForDatabase(retries = 15, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established');
      return true;
    } catch (err) {
      console.log(`⏳ Attempt ${i}/${retries} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Could not connect to database after multiple retries');
}

async function startServer() {
  try {
    // Wait for database to be ready
    await waitForDatabase();

    // Only auto-sync in dev/test, never in production
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync(); // or omit entirely if using migrations
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();