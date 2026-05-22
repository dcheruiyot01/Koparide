/**
 * ----------------
 * Multer configuration for driver's license uploads.
 * - In PRODUCTION: uses memoryStorage (files go directly to Spaces via the storage service).
 * - In DEVELOPMENT: uses diskStorage (local `uploads/licenses/` folder for testing).
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper to ensure directory exists (only used in development)
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Choose storage based on environment
const isProduction = process.env.NODE_ENV === 'production';

let storage;
if (isProduction) {
    // Production: store files in memory (buffer will be uploaded to Spaces)
    storage = multer.memoryStorage();
} else {
    // Development: save files to disk for local testing
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = "uploads/licenses";
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, unique + path.extname(file.originalname));
        }
    });
}

// File filter – allow images AND PDFs (common for driver's licenses)
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
    }
};

// Limits: 5MB per file
const limits = { fileSize: 5 * 1024 * 1024 };

// Create and export the multer instance
const uploadLicense = multer({ storage, fileFilter, limits });

module.exports = uploadLicense;