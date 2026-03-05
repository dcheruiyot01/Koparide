// controllers/profile.controller.js
const Profile = require('../models/profile');

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

exports.updateProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ where: { userid: req.user.id } });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

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

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const imageUrl = `http://localhost:4000/uploads/profiles/${req.file.filename}`;

        const profile = await Profile.findOne({ where: { userid: req.user.id } });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        await profile.update({ profileImageUrl: imageUrl });

        return res.json({ url: imageUrl });
    } catch (err) {
        console.error("Image upload error:", err);
        return res.status(500).json({ message: "Failed to upload image" });
    }
};

exports.uploadLicenseImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const url = `http://localhost:4000/uploads/licenses/${req.file.filename}`;

        await Profile.update(
            { driversLicenseUrl: url },
            { where: { userid: req.user.id } }
        );
        res.json({ url: url });
    } catch (err) {
        onsole.error("Image upload error:", err);
        return res.status(500).json({ message: "Failed to upload image" });
    }



};

