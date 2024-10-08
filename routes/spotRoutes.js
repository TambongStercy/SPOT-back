const express = require('express');
const { createSpot, getSpots, getSpotById, getFilteredSpots, rateSpot, getSpotRatings, updateSpot } = require('../controllers/spot.controller');
const router = express.Router();

// Route to get a spot by its ID
router.get('/:id', getSpotById);

// Route for paginated spots with filters
router.get('/', getFilteredSpots);

// Route for rating a spot
router.post('/:id/rate', rateSpot);

// Route for getting all ratings for a spot
router.get('/:id/ratings', getSpotRatings);

router.get('/all', getSpots);



// Route to create a new spot with image uploads
router.post('/create', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'menuImages', maxCount: 10 }
]), createSpot);

// Route to update a spot with image uploads
router.put('/:id', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'menuImages', maxCount: 10 }
]), updateSpot);



module.exports = router;
