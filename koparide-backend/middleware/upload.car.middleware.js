// middleware/upload.car.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to ensure directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Storage for car images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/cars/";
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

// Storage for insurance documents
const insuranceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/cars/insurance/";
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage for registration / logbook documents
const registrationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/cars/registration/";
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (optional, restrict types)
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, PDF allowed.'), false);
    }
};

// Individual multer instances (kept for backward compatibility)
const uploadImages = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

const uploadInsurance = multer({
    storage: insuranceStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

const uploadRegistration = multer({
    storage: registrationStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

// NEW: Combined middleware that accepts images (array), logbook (single), insurance (single)
const uploadCarAssets = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Route to the correct sub‑folder based on fieldname
            if (file.fieldname === 'logbook') {
                ensureDir("uploads/cars/registration/");
                cb(null, "uploads/cars/registration/");
            } else if (file.fieldname === 'insurance') {
                ensureDir("uploads/cars/insurance/");
                cb(null, "uploads/cars/insurance/");
            } else {
                ensureDir("uploads/cars/");
                cb(null, "uploads/cars/");
            }
        },
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + unique + ext);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'logbook', maxCount: 1 },
    { name: 'insurance', maxCount: 1 }
]);

// Export all (old + new)
module.exports = {
    uploadImages,          // for backward compatibility (array of 'images')
    uploadInsurance,       // single 'insurance'
    uploadRegistration,    // single 'logbook'
    uploadCarAssets        // NEW: combined fields
};