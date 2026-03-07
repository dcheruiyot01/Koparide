// models/index.js
/**
 * Models Index
 * -------------------------
 * Loads model instances that were defined with sequelize.define
 * (no factory invocation). Runs associations if present.
 */

const path = require('path');
const sequelize = require('../config/db'); // your configured Sequelize instance
const Sequelize = require('sequelize');

const db = {};

// Require model files that already call sequelize.define and export the model instance
db.User = require('./User');         // expects module.exports = sequelize.define(...)
db.Car = require('./Car');
db.CarImage = require('./CarImage');
db.Profile = require('./Profile');
db.Reservation = require('./Reservations');

// Attach sequelize and Sequelize constructors for consumers
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Run associations if defined on the model instances
Object.keys(db).forEach((modelName) => {
    if (db[modelName] && typeof db[modelName].associate === 'function') {
        db[modelName].associate(db);
    }
});

module.exports = db;
