const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// IMPORTANT:
// SQLite cannot handle UUID type OR defaultValue: UUIDV4
// SQLite cannot handle ENUM
// SQLite cannot handle strict constraints
// This model is fully compatible with BOTH Postgres and SQLite

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: true,   // allow null for OAuth users
    validate: {
      // Only require password for local accounts
      isPasswordRequired(value) {
        if (this.authProvider === 'local' && !value) {
          throw new Error('Password is required for local accounts');
        }
      }
    }
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refreshTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  githubId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  authProvider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'local'
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'renter',
    validate: {
      isIn: [['renter', 'host', 'admin']],
    },
  },
});

User.associate = models => {
  User.hasMany(models.Car, { foreignKey: 'ownerId', as: 'cars' });
  User.hasOne(models.Profile, { foreignKey: 'userid', onDelete: 'CASCADE' });
};

module.exports = User;