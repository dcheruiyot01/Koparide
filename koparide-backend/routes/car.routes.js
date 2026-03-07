/**
 * Car Routes
 * -------------------------
 * Maps HTTP endpoints to CarController methods.
 */

const express = require('express');
const router = express.Router();
const carController = require('../controllers/car.controller'); // ensure this path is correct

// Public routes
router.get('/', carController.getPublicCars);           // List approved cars
router.get('/:id', carController.getCarById);           // Get car details

// Owner routes (require authentication middleware upstream)
router.post('/', carController.createCarListing);       // Create new car listing
router.post('/:id/images', carController.uploadCarImages);   // Upload car images
router.post('/:id/insurance', carController.uploadInsurance); // Upload insurance
router.delete('/:id', carController.deleteCar);         // Soft delete car

// Admin routes (require admin role middleware upstream)
router.put('/:id/approve', carController.approveCar);   // Approve car listing
router.put('/:id/reject', carController.rejectCar);     // Reject car listing

// Rental routes (require authentication)
router.post('/:id/rent', carController.rentCar);        // Rent a car
router.post('/:id/return', carController.returnCar);    // Return a car

module.exports = router;