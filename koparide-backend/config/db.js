/**
 * Sequelize Database Initialization
 *
 * Uses:
 *  - In-memory SQLite for tests (fast, isolated)
 *  - PostgreSQL for development/production
 */

const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
      }
    );

module.exports = sequelize;
