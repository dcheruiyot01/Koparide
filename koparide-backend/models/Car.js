const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Car = sequelize.define('Car', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    make: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1900, max: new Date().getFullYear() }
    },

    pricePerDay: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    classification: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Saloon',
        validate: {
            isIn: [['SUV', 'Sedan', 'Saloon', 'Pickup', 'Truck', 'Hatchback', 'Van', 'Coupe', 'Convertible']]
        }
    },

    // ✅ New feature fields
    seats: { type: DataTypes.INTEGER, allowNull: false },
    fuelType: { type: DataTypes.STRING, allowNull: false },
    mpg: { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // fuel efficiency
    transmission: { type: DataTypes.STRING, allowNull: true },
    cruiseControl: { type: DataTypes.BOOLEAN, defaultValue: false },
    cc: { type: DataTypes.INTEGER, allowNull: true }, // engine capacity

    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'approved', 'rejected']]
        }
    },

    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },

    rented_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'cars',
    timestamps: true
});

Car.associate = models => {
    Car.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    Car.belongsTo(models.User, { foreignKey: 'rented_to', as: 'renter' });
    Car.hasMany(models.CarImage, { foreignKey: 'carId', as: 'imagesList' });
    Car.hasMany(models.Reservation, { foreignKey: 'carId', as: 'reservations' });
};

module.exports = Car;