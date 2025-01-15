const spotService = require('../services/spot.services');
const ratingService = require('../services/rating.services');
const uploadService = require('../services/upload.services');
const { attachFavoriteStatus } = require('../services/favorite.services');

// Controller to create a new spot
exports.createSpot = async (req, res) => {
    try {
        const { files, body } = req;

        // Upload cover image, profile image, and menu images to the cloud
        let coverImageUrl, profileImageUrl, menuImagesUrls = [];
        
        if (files.coverImage) {
            coverImageUrl = await uploadService.uploadToCloudinary(files.coverImage[0]);
        }
        if (files.profileImage) {
            profileImageUrl = await uploadService.uploadToCloudinary(files.profileImage[0]);
        }
        if (files.menuImages) {
            for (const file of files.menuImages) {
                const imageUrl = await uploadService.uploadToCloudinary(file);
                menuImagesUrls.push(imageUrl);
            }
        }

        // Create the new spot with the uploaded image URLs
        const newSpot = await spotService.createSpot({
            ...body,
            coverImage: coverImageUrl,
            profileImage: profileImageUrl,
            menuImages: menuImagesUrls
        });

        res.json(newSpot);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to update a spot by ID
exports.updateSpot = async (req, res) => {
    try {
        const { files, body, params } = req;

        let updates = { ...body };
        
        // If there are new images uploaded, update them
        if (files.coverImage) {
            updates.coverImage = await uploadService.uploadToCloudinary(files.coverImage[0]);
        }
        if (files.profileImage) {
            updates.profileImage = await uploadService.uploadToCloudinary(files.profileImage[0]);
        }
        if (files.menuImages) {
            updates.menuImages = [];
            for (const file of files.menuImages) {
                const imageUrl = await uploadService.uploadToCloudinary(file);
                updates.menuImages.push(imageUrl);
            }
        }

        // Update the spot
        const updatedSpot = await spotService.updateSpot({ spotId: params.id, updates });
        const spotWithFavorite = await attachFavoriteStatus(updatedSpot, req.user?.id);
        res.json(spotWithFavorite);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get all spots
exports.getSpots = async (req, res) => {
    try {
        const spots = await spotService.getSpots();
        const spotsWithFavorites = await attachFavoriteStatus(spots, req.user?.id);
        res.json(spotsWithFavorites);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get a spot by its ID
exports.getSpotById = async (req, res) => {
    try {
        const spot = await spotService.getSpotById(req.params.id);
        if (!spot) return res.status(404).json({ msg: 'Spot not found' });
        
        const spotWithFavorite = await attachFavoriteStatus(spot, req.user?.id);
        res.json(spotWithFavorite);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting paginated spots with filters
exports.getFilteredSpots = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;  // Extract pagination and filters from query params
        const spots = await spotService.getFilteredSpots({ page, limit, filters });
        const spotsWithFavorites = await attachFavoriteStatus(spots.spots, req.user?.id);
        spots.spots = spotsWithFavorites;  // Replace spots with spots with favorite status
        res.json(spots);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to rate a spot
exports.rateSpot = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const ratedSpot = await ratingService.rateSpot({
            spotId: req.params.id,
            userId: req.user.id,
            rating,
            review
        });
        const spotWithFavorite = await attachFavoriteStatus(ratedSpot, req.user.id);
        res.json(spotWithFavorite);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get all ratings for a spot
exports.getSpotRatings = async (req, res) => {
    try {
        const ratings = await ratingService.getRatingsForSpot(req.params.id);
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting nearby spots with pagination
exports.getNearbySpots = async (req, res) => {
    try {
        const { 
            latitude, 
            longitude, 
            radius = 5000, // Default radius in meters (5km)
            page = 1, 
            limit = 10,  
            ...filters 
        } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ 
                msg: 'Latitude and longitude are required parameters' 
            });
        }

        const spots = await spotService.getNearbySpots({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: parseFloat(radius),
            page: parseInt(page),
            limit: parseInt(limit),
            filters
        });

        const spotsWithFavorites = await attachFavoriteStatus(spots.spots, req.user?.id);
        spots.spots = spotsWithFavorites;
        
        res.json(spots);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};