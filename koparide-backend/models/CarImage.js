const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CarImage = sequelize.define('CarImage', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    carId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    url: { type: DataTypes.TEXT, allowNull: false },
    altText: { type: DataTypes.TEXT, allowNull: true },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
    position: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: 'car_images',
    timestamps: true,
    indexes: [
        { fields: ['carId', 'position'] },
        { fields: ['carId', 'isPrimary'] }
    ]
});

CarImage.associate = models => {
    CarImage.belongsTo(models.Car, { foreignKey: 'carId', as: 'vehicle' });
};

module.exports = CarImage;
