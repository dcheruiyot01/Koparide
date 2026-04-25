const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require authentication + admin role
// router.use(auth, admin);

// Car management
router.get('/cars', adminController.getAllCars);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId/profile', auth, admin, adminController.getUserProfile);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;