// middleware/upload.js
const multer = require("multer");
const path = require("path");

const imageStorage = multer.diskStorage({
    destination: "uploads/cars",
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});

// Storage for insurance
const insuranceStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/cars/insurance/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Storage for registration
const registrationStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/cars/registration/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadInsurance = multer({ storage: insuranceStorage });
const uploadRegistration = multer({ storage: registrationStorage });
const uploadImages = multer({ storage: imageStorage });

// Export all three
module.exports = {
    uploadImages,
    uploadInsurance,
    uploadRegistration
};