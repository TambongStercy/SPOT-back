const express = require('express');
const multer = require('multer');
const {
    createSpot,
    getSpots,
    getSpotById,
    getFilteredSpots,
    rateSpot,
    getSpotRatings,
    updateSpot,
    getNearbySpots,
} = require('../controllers/spot.controller');
const { authenticateUser, optionalAuthenticateUser } = require('../middleware/auth');
const upload = multer({ dest: 'uploads/' });
const { cache } = require('../config/redis');

const {
    validateSpot,
    validateFilterSpots,
    validateRateSpot,
} = require('../middleware/spotValidation');

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

// Route to get paginated and filtered spots (Cached for 5 minutes)
router.get('/', optionalAuthenticateUser, cache(300), validateFilterSpots, getFilteredSpots);

// Route to get a spot by its ID (Cached for 5 minutes)
router.get('/:id', optionalAuthenticateUser, cache(300), getSpotById);

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

// Route to rate a spot
router.post('/:id/rate', authenticateUser, validateRateSpot, rateSpot);

// Route to get all ratings for a spot (Cached for 5 minutes)
router.get('/:id/ratings', cache(300), getSpotRatings);


router.get('/nearby', optionalAuthenticateUser, getNearbySpots);


module.exports = router;
