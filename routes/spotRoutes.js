const express = require('express');
const {
    createSpot,
    getSpots,
    getSpotById,
    getFilteredSpots,
    rateSpot,
    getSpotRatings,
    updateSpot,
} = require('../controllers/spot.controller');
const authenticateUser = require('../middleware/auth'); // Authentication middleware
const upload = require('../middleware/upload'); // Multer middleware for file uploads
const {
    validateSpot,
    validateFilterSpots,
    validateRateSpot,
} = require('../middleware/spotValidation'); // Validation middleware

const router = express.Router();

// Route to create a new spot with image uploads
router.post(
    '/create',
    authenticateUser,
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 },
        { name: 'menuImages', maxCount: 10 },
    ]),
    validateSpot,
    createSpot
);

// Route to update a spot with image uploads
router.put(
    '/:id',
    authenticateUser,
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'profileImage', maxCount: 1 },
        { name: 'menuImages', maxCount: 10 },
    ]),
    validateSpot,
    updateSpot
);

// Route to get a spot by its ID (No validation needed)
router.get('/:id', getSpotById);

// Route to get paginated and filtered spots
router.get('/', validateFilterSpots, getFilteredSpots);

// Route to rate a spot
router.post('/:id/rate', authenticateUser, validateRateSpot, rateSpot);

// Route to get all ratings for a spot (No validation needed)
router.get('/:id/ratings', getSpotRatings);

module.exports = router;
