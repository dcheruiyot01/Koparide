// src/models/Reservation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    carId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: false },

    pickupLocation: { type: DataTypes.TEXT, allowNull: true },
    protectionPlan: { type: DataTypes.STRING, allowNull: true },
    promoCode: { type: DataTypes.STRING, allowNull: true },

    // Monetary fields (DECIMAL for display; consider integer cents in production)
    subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    protectionCost: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },

    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'KES' },

    // Payment / status
    paymentIntentId: { type: DataTypes.STRING, allowNull: true },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'reservations',
    timestamps: true,
    indexes: [
        { fields: ['carId', 'startAt', 'endAt'] },
        { fields: ['userId'] },
        { fields: ['status'] }
    ]
});

Reservation.associate = function(models) {
    Reservation.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
    Reservation.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = Reservation;