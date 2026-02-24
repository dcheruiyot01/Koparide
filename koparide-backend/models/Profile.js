// models/profile.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // adjust path to your DB config
import User from './user.js'; // assuming you already have a User model

const Profile = sequelize.define('Profile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
        unique: true, // one profile per user
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    driversLicenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true, // optional: enforce uniqueness
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    profileImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    rentalCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 5,
        },
    },
    preferredCarType: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    languagePreference: {
        type: DataTypes.STRING(20),
        defaultValue: 'en',
    },
    notificationPreferences: {
        type: DataTypes.JSON,
        defaultValue: {
            email: true,
            sms: false,
            push: true,
        },
    },
}, {
    timestamps: true,
    tableName: 'profiles',
});

// Associations
User.hasOne(Profile, { foreignKey: 'userId', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId' });

export default Profile;
