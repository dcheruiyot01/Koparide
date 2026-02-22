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

    await sequelize.sync();
    // console.log('Database synced');

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
