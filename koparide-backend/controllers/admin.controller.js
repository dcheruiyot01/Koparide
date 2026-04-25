const { Car, User, CarImage, Profile } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// controllers/admin.controller.js
exports.getUserProfile = async (req, res, next) => {
    try {
        userId = req.params.userId;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Profile, as: 'Profile', attributes: ['nationalIdNumber', 'driversLicenseNumber', 'driversLicenseExpiry', 'about', 'address', 'phoneNumber', 'gender', 'dateOfBirth', 'preferredCarType', 'languagePreference', 'profileImageUrl'] }
            ]
        });
        if (!user) throw new AppError('User not found', 404);

        // Add car count
        const carCount = await Car.count({ where: { ownerId: user.id } });

        // Transform to frontend-friendly format
        const profileData = {
            id: user.id,
            firstName: user.Profile?.firstName || '',
            lastName: user.Profile?.lastName || '',
            about: user.Profile?.about || '',
            languagePreference: user.Profile?.languagePreference || 'en',
            phoneNumber: user.Profile?.phoneNumber || '',
            address: user.Profile?.address || '',
            rentalCount: user.Profile?.rentalCount || 0,
            rating: user.Profile?.rating || '0',
            createdAt: user.createdAt,
            isVerified: user.isVerified,
            driversLicenseUrl: user.Profile?.driversLicenseUrl,
            nationalIdNumber: user.Profile?.nationalIdNumber,
            driversLicenseNumber: user.Profile?.driversLicenseNumber,
            driversLicenseExpiry: user.Profile?.driversLicenseExpiry,
            gender: user.Profile?.gender,
            dateOfBirth: user.Profile?.dateOfBirth,
            preferredCarType: user.Profile?.preferredCarType,
            profileImageUrl: user.Profile?.profileImageUrl,
            responseRate: user.Profile?.responseRate || 98,
            reviewCount: user.Profile?.reviewCount || 0,
        };

        res.json({ success: true, user: profileData, carCount });
    } catch (err) {
        next(err);
    }
};
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Profile,
                    as: 'Profile',   // must match the alias in User model
                    attributes: ['id','nationalIdNumber', 'driversLicenseNumber', 'driversLicenseExpiry', 'firstName', 'lastName', 'address']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Count cars for each user
        const usersWithCarCount = await Promise.all(users.map(async (user) => {
            const carCount = await Car.count({ where: { ownerId: user.id } });
            // Convert to plain object and add carCount
            const plain = user.toJSON();
            return { ...plain, carCount };
        }));

        res.json({ success: true, users: usersWithCarCount });
    } catch (err) {
        next(err);
    }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['admin','host','user','renter'].includes(role)) {
            throw new AppError('Invalid role', 400);
        }
        const user = await User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);
        await user.update({ role });
        logger.info(`User ${user.id} role changed to ${role} by admin`);
        res.json({ success: true, message: 'Role updated' });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            throw new AppError('Cannot delete yourself', 400);
        }
        await User.destroy({ where: { id } });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};

exports.getAllCars = async (req, res, next) => {
    try {
        const cars = await Car.findAll({
            include: [
                { model: CarImage, as: 'imagesList' },
                { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, cars });
    } catch (err) {
        next(err);
    }
};