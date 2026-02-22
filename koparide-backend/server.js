/**
 * Server Entry Point
 *
 * Handles:
 *  - Database connection
 *  - Model syncing
 *  - Starting the HTTP server
 */

require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db'); // your Sequelize instance

async function startServer() {
  try {
    await sequelize.authenticate();
    // console.log('Database connected');

    // Only auto-sync in dev/test, never in production
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await sequelize.sync({ alter: true });
      console.log('Database synced (dev/test)');
    } else {
      await sequelize.sync(); // or omit entirely if using migrations
      // console.log('Database synced (production)');
    }

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      // console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}
startServer();