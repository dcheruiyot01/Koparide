// services/storage.service.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,   // origin endpoint
    region: 'us-east-1',                       // required for Spaces (any value works)
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
});

/**
 * Upload a file buffer to Spaces and return the CDN URL
 */
async function uploadToSpaces(fileBuffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
    });
    await s3.send(command);
    return `${process.env.DO_SPACES_CDN_ENDPOINT}/${key}`;
}

/**
 * Upload multiple car images
 * @param {Array} imageFiles - multer files (with buffer, originalname, mimetype)
 * @param {number|string} carId
 * @returns {Promise<string[]>} array of CDN URLs
 */
async function uploadCarImages(imageFiles, carId) {
    const urls = [];
    for (const file of imageFiles) {
        const ext = file.originalname.split('.').pop();
        const key = `cars/images/${carId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${ext}`;
        const url = await uploadToSpaces(file.buffer, key, file.mimetype);
        urls.push(url);
    }
    return urls;
}

/**
 * Upload a single document (logbook or insurance)
 * @param {Object} file - multer file object
 * @param {number|string} carId
 * @param {string} docType - 'registration' or 'insurance'
 * @returns {Promise<string>} CDN URL
 */
async function uploadDocument(file, carId, docType) {
    const ext = file.originalname.split('.').pop();
    const key = `cars/${docType}/${carId}_${Date.now()}.${ext}`;
    return await uploadToSpaces(file.buffer, key, file.mimetype);
}

/**
 * Upload a profile image
 * @param {Object} file - multer file object (with buffer)
 * @param {number|string} userId
 * @returns {Promise<string>} CDN URL
 */
async function uploadProfileImage(file, userId) {
    const ext = file.originalname.split('.').pop();
    const key = `profiles/${userId}_${Date.now()}.${ext}`;
    return await uploadToSpaces(file.buffer, key, file.mimetype);
}

/**
 * Upload a driver's license document/image
 * @param {Object} file - multer file object
 * @param {number|string} userId
 * @returns {Promise<string>} CDN URL
 */
async function uploadLicense(file, userId) {
    const ext = file.originalname.split('.').pop();
    const key = `licenses/${userId}_${Date.now()}.${ext}`;
    return await uploadToSpaces(file.buffer, key, file.mimetype);
}

module.exports = {
    uploadCarImages,
    uploadDocument,
    uploadProfileImage,
    uploadLicense,
};