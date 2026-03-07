// src/config/db.js
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest
    ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    : new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false
    });

// optional: help debugging by copying env values into options
if (!isTest && process.env.DATABASE_URL) {
    sequelize.options.database = sequelize.options.database || process.env.DB_NAME;
    sequelize.options.host = sequelize.options.host || process.env.DB_HOST;
}

module.exports = sequelize;
