/**
 * Car Routes
 * -------------------------
 * Maps HTTP endpoints to CarController methods.
 */

const express = require('express');
const router = express.Router();
const { uploadCarAssets } = require("../middleware/upload.car.middleware"); // new combined middleware
const carController = require('../controllers/car.controller');
const auth = require("../middleware/auth.middleware");

// Public routes
router.get('/', carController.getPublicCars);           // List approved cars
router.get('/:id', carController.getCarById);           // Get car details

// Owner routes (require authentication)
// Use combined middleware that accepts images (array), logbook (single), insurance (single)
router.post('/', auth, uploadCarAssets, carController.createCarListing);
router.put('/:id', auth, uploadCarAssets, carController.updateCarListing);

// Separate document upload endpoints (kept for backward compatibility, but frontend no longer uses them)
router.post('/:id/registration', auth, uploadCarAssets, carController.uploadRegistration);
router.post('/:id/insurance', auth, uploadCarAssets, carController.uploadInsurance);
router.delete('/:id', auth, carController.deleteCar);         // Soft delete car

// Admin routes (require admin role middleware upstream)
router.put('/:id/approve', auth, carController.approveCar);   // Approve car listing
router.put('/:id/reject', auth, carController.rejectCar);     // Reject car listing

// Rental routes (require authentication)
router.post('/:id/rent', auth, carController.rentCar);        // Rent a car
router.post('/:id/return', auth, carController.returnCar);    // Return a car

module.exports = router;