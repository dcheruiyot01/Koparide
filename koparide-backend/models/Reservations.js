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

    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },

    pickupLocation: { type: DataTypes.TEXT, allowNull: true },
    protectionPlan: { type: DataTypes.STRING, allowNull: true },
    promoCode: { type: DataTypes.STRING, allowNull: true },

    subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    protectionCost: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },

    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'KES' },

    paymentIntentId: { type: DataTypes.STRING, allowNull: true },

    // M‑Pesa specific fields
    mpesaCheckoutId: { type: DataTypes.STRING, allowNull: true },
    mpesaReceipt: { type: DataTypes.STRING, allowNull: true },
    paymentError: { type: DataTypes.TEXT, allowNull: true },

    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'failed', 'payment_pending'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'reservations',
    timestamps: true,
    indexes: [
        { fields: ['carId', 'startDate', 'endDate'] },
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['mpesaCheckoutId'] }  // optional, speeds up lookups by checkout ID
    ]
});

Reservation.associate = function(models) {
    Reservation.belongsTo(models.Car, { foreignKey: 'carId', as: 'car' });
    Reservation.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = Reservation;