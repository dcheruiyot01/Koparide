// controllers/profile.controller.js

const Profile = require('../models/profile');

/**
 * Get the authenticated user's profile
 */
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { userid: req.user.id } });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        return res.json(profile);
    } catch (err) {
        console.error("Get profile error:", err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

/**
 * Update the authenticated user's profile
 * NOTE: Only allow specific fields to be updated to prevent overwriting sensitive data
 */
exports.updateProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { userid: req.user.id } });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // TODO:: Whitelist fields to update
        await profile.update(req.body);

        return res.json({
            message: 'Profile updated successfully',
            profile
        });
    } catch (err) {
        console.error("Update profile error:", err);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
};

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
        console.error("Image upload error:", err);
        return res.status(500).json({ error: "Failed to upload image" });
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
        console.error("Image upload error:", err);
        return res.status(500).json({ error: "Failed to upload image" });
    }
};
