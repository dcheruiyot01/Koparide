/**
 * Car Routes
 * -------------------------
 * Maps HTTP endpoints to CarController methods.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadImages = require("../middleware/upload.car.middleware");
const carController = require('../controllers/car.controller');
const auth = require("../middleware/auth.middleware"); // ensure this path is correct

// Public routes
router.get('/', carController.getPublicCars);           // List approved cars
router.get('/:id', carController.getCarById);           // Get car details

// Owner routes (require authentication middleware upstream)
router.post('/', auth, uploadImages.array('images'), carController.createCarListing); // Create new car listing
router.put('/:id', auth, uploadImages.array('images'), carController.updateCarListing); // update car listing


// router.post('/:id/images', auth, uploadImages.array('images'), carController.uploadCarImages);   // Upload car images
router.post('/:id/insurance', auth, carController.uploadInsurance); // Upload insurance
router.delete('/:id', auth, carController.deleteCar);         // Soft delete car

// Admin routes (require admin role middleware upstream)
router.put('/:id/approve', auth, carController.approveCar);   // Approve car listing
router.put('/:id/reject', auth, carController.rejectCar);     // Reject car listing

// Rental routes (require authentication)
router.post('/:id/rent', auth, carController.rentCar);        // Rent a car
router.post('/:id/return', auth, carController.returnCar);    // Return a car

module.exports = router;