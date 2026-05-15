// controllers/profile.controller.js

const Profile = require('../models/Profile');
const User = require('../models/User');
// Whitelist of fields that can be updated
const UPDATABLE_FIELDS = new Set([
    'firstName', 'lastName', 'phoneNumber', 'nationalIdNumber',
    'gender', 'dateOfBirth', 'address', 'profileImageUrl',
    'driversLicenseUrl', 'preferredCarType', 'languagePreference', 'about', 'driversLicenseNumber','driversLicenseExpiry'
]);


/**
 * Get the authenticated user's profile
 */
exports.getProfile = async (req, res) => {
    try {
        let profile = await Profile.findOne({ where: { userid: req.user.id } });
        if (!profile) {
            let profile = await Profile.create({
                userid: req.user.id,
            });
            return res.json(profile);
        }
        const user = await User.findByPk(req.user.id);
        const profileData = transformProfile(profile, user);
        return res.json({ success: true, user: profileData });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { userid: req.user.id } });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        // Filter only allowed fields from request body
        const updateData = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (UPDATABLE_FIELDS.has(key) && value !== undefined) {
                updateData[key] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        await profile.update(updateData);

        // Fetch updated profile + user and return full object
        const updatedProfile = await Profile.findOne({ where: { userid: req.user.id } });
        const user = await User.findByPk(req.user.id);
        const profileData = transformProfile(updatedProfile, user);

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: profileData
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update profile ' + err.message });
    }
};

// Helper to transform profile + user into frontend‑ready object
function transformProfile(profile, user) {
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'User';
    const initials = (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '');
    const memberSince = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';

    let age = null;
    if (profile.dateOfBirth) {
        const today = new Date();
        const birth = new Date(profile.dateOfBirth);
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    }

    return {
        id: profile.userid,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        name: fullName,
        initials: initials.toUpperCase(),
        email: user?.email || '',
        phoneNumber: profile.phoneNumber || '',
        nationalIdNumber: profile.nationalIdNumber || '',
        driversLicenseNumber: profile.driversLicenseNumber || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth || null,
        driversLicenseExpiry: profile.driversLicenseExpiry || null,
        age,
        address: profile.address || '',
        location: profile.address || 'Location not set',
        profileImageUrl: profile.profileImageUrl || '',
        driversLicenseUrl: profile.driversLicenseUrl || '',
        rentalCount: profile.rentalCount || 0,
        rating: parseFloat(profile.rating) || 0,
        preferredCarType: profile.preferredCarType || '',
        languagePreference: profile.languagePreference || 'en',
        about: profile.about || '',
        memberSince,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        verifiedEmail: profile.verifiedEmail || false,
        verifiedPhone: profile.verifiedPhone || false,
        verifiedLicense: profile.verifiedLicense || false,
        verifiedId: profile.verifiedId || false,
        responseRate: profile.responseRate || 95,
        trips: profile.trips || 0,
        reviews: profile.reviews || 0,
        notificationPreferences: {
            email: true,
            sms: !!profile.phoneNumber,
            push: true
        }
    };
}

/**
 * Upload and update profile image
 */
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // TODO:: Replace hardcoded localhost with environment variable (e.g., process.env.BASE_URL)
        const imageUrl = process.env.BASE_URL+`/uploads/profiles/${req.file.filename}`;

        const profile = await Profile.findOne({ where: { userid: req.user.id } });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        await profile.update({ profileImageUrl: imageUrl });

        return res.json({ url: imageUrl });
    } catch (err) {
        return res.status(500).json({ error: "Failed to upload image " + err.message });
    }
};

/**
 * Upload and update driver's license image
 */
exports.uploadLicenseImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // TODO:: Replace hardcoded localhost with environment variable (e.g., process.env.BASE_URL)
        const url = process.env.BASE_URL+`/uploads/licenses/${req.file.filename}`;

        const profile = await Profile.findOne({ where: { userid: req.user.id } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        await profile.update({ driversLicenseUrl: url });

        return res.json({ url });
    } catch (err) {
        return res.status(500).json({ error: "Failed to upload image " + err.message });
    }
};
