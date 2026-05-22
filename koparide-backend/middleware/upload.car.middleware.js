// middleware/upload.car.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to ensure directory exists (only needed for dev)
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Choose storage based on environment
const isProduction = process.env.NODE_ENV === 'production';

// For production: use memoryStorage (files go to Spaces)
// For development: keep diskStorage (local files for testing)
const getStorage = (subfolder = 'cars/images') => {
    if (isProduction) {
        return multer.memoryStorage();
    }
    // Development: disk storage
    return multer.diskStorage({
        destination: (req, file, cb) => {
            let dir = `uploads/${subfolder}/`;
            if (file.fieldname === 'logbook') dir = "uploads/cars/registration/";
            else if (file.fieldname === 'insurance') dir = "uploads/cars/insurance/";
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + unique + ext);
        }
    });
};

// File filter (same for both environments)
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, PDF allowed.'), false);
    }
};

// Multer limits (same)
const limits = { fileSize: 5 * 1024 * 1024 };

// Individual upload instances (for backward compatibility)
const uploadImages = multer({
    storage: getStorage('cars'),
    limits,
    fileFilter
});

const uploadInsurance = multer({
    storage: getStorage('cars/insurance'),
    limits,
    fileFilter
});

const uploadRegistration = multer({
    storage: getStorage('cars/registration'),
    limits,
    fileFilter
});

// Combined middleware for car assets (used by your controller)
const uploadCarAssets = multer({
    storage: getStorage(), // passes 'cars' as default
    limits,
    fileFilter
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'logbook', maxCount: 1 },
    { name: 'insurance', maxCount: 1 }
]);

module.exports = {
    uploadImages,
    uploadInsurance,
    uploadRegistration,
    uploadCarAssets
};