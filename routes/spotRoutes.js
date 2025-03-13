const express = require('express');
const multer = require('multer');
const {
    createSpot,
    getSpots,
    getSpotById,
    updateSpot,
    rateSpot,
    getSpotRatings,
    getSpotRatingStats,
    getRecommendedSpots,
    getTrendingSpots,
    getFilteredSpots,
    getRandomSpot
} = require('../controllers/spot.controller');
const { authenticateUser, optionalAuthenticateUser } = require('../middleware/auth');
const upload = multer({ dest: 'uploads/' });
const { cache } = require('../config/redis');

const {
    validateSpot,
    validateFilterSpots,
    validateRateSpot,
    validateRecommendedSpots,
    validateTrendingSpots
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

// Route to get recommended spots (requires authentication)
router.get('/recommended', authenticateUser, validateRecommendedSpots, cache(300), getRecommendedSpots);

// Route to get trending spots (cached for 5 minutes)
router.get('/trending', optionalAuthenticateUser, validateTrendingSpots, cache(300), getTrendingSpots);

// Route to get a random recommended spot (cached for 5 minutes)
router.get('/random', optionalAuthenticateUser, cache(300), getRandomSpot);

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

// Route to get all ratings for a spot with pagination
router.get('/:id/ratings', cache(300), getSpotRatings);

// Route to get rating statistics for a spot
router.get('/:id/rating-stats', cache(300), getSpotRatingStats);

module.exports = router;
