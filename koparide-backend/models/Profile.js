const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Profile = sequelize.define('Profile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    phoneNumber: { type: DataTypes.STRING(20), allowNull: false },
    nationalIdNumber: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    driversLicenseNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    profileImageUrl: { type: DataTypes.TEXT, allowNull: true },
    driversLicenseUrl: { type: DataTypes.TEXT, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    about: { type: DataTypes.TEXT, allowNull: true },
    rentalCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: { min: 0, max: 5 }
    },
    preferredCarType: { type: DataTypes.STRING(50), allowNull: true },
    languagePreference: { type: DataTypes.STRING(20), defaultValue: 'en' },
    notificationPreferences: {
        type: DataTypes.JSON,
        defaultValue: { email: true, sms: false, push: true }
    }
}, {
    timestamps: true,
    tableName: 'profiles'
});

// Associations
Profile.associate = models => {
    Profile.belongsTo(models.User, { foreignKey: 'userid', as: 'user' });
};

module.exports = Profile;
