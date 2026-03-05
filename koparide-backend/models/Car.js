/**
 * Car Model
 * -------------------------
 * Represents a car listed by a host.
 * Includes details, pricing, images, insurance, classification, and approval status.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User'); // <-- Import User model

const Car = sequelize.define('Car', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    // Foreign key to User
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    make: {
        type: DataTypes.STRING,
        allowNull: false
    },

    model: {
        type: DataTypes.STRING,
        allowNull: false
    },

    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1900,
            max: new Date().getFullYear()
        }
    },

    mileage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    pricePerDay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    classification: {
        type: DataTypes.STRING, // use STRING for cross‑DB compatibility
        allowNull: false,
        defaultValue: 'Saloon',
        validate: {
            isIn: [['SUV', 'Saloon', 'Pickup', 'Hatchback', 'Van', 'Coupe', 'Convertible']]
        }
    },
    terms: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    insuranceUrl: {
        type: DataTypes.STRING,
        allowNull: true
        // TODO:: store in cloud storage (S3, GCP, Azure) in production
    },

    images: {
        type: DataTypes.JSON, // store array of image URLs
        allowNull: true
    },

    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    // Soft delete flag
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Renter association
    rented_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'SET NULL', // if renter is deleted, clear field
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'cars',
    timestamps: true
});

// Associations
Car.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Car, { foreignKey: 'ownerId', as: 'cars' });

// Renter association
Car.belongsTo(User, { foreignKey: 'rented_to', as: 'renter' });

module.exports = Car;
