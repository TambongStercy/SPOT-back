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
        const spot = await spotService.getSpotById(req.params.id, req.user?.id);
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
        const userId = req.user.id;
        const spotId = req.params.id;

        // Rate the spot
        const ratedSpot = await ratingService.rateSpot({
            spotId,
            userId,
            rating,
            review
        });

        // Award points for rating (10 points for rating, extra 5 if review is provided)
        try {
            const pointTransactionService = require('../services/pointTransaction.service');
            const pointsAmount = review && review.trim().length > 0 ? 15 : 10;

            await pointTransactionService.awardPointsFromSpot({
                userId,
                spotId,
                amount: pointsAmount,
                reason: 'rating'
            });

            // Add points info to response
            ratedSpot.pointsAwarded = {
                amount: pointsAmount,
                message: `You earned ${pointsAmount} points for rating this spot!`
            };
        } catch (error) {
            console.error('Error awarding points for rating:', error);
            // Don't fail the rating if points award fails
        }

        const spotWithFavorite = await attachFavoriteStatus(ratedSpot, userId);
        res.json(spotWithFavorite);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get all ratings for a spot with pagination
exports.getSpotRatings = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const ratingData = await ratingService.getSpotRatings(id, parseInt(page), parseInt(limit));

        res.status(200).json(ratingData);
    } catch (err) {
        console.error('Error fetching spot ratings:', err);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};

// Controller to get rating statistics for a spot
exports.getSpotRatingStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await ratingService.getSpotRatingStats(id);
        res.status(200).json(stats);
    } catch (err) {
        console.error('Error fetching spot rating stats:', err);
        res.status(500).json({ error: 'Failed to fetch rating statistics' });
    }
};

// Get recommended spots
exports.getRecommendedSpots = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, ...filters } = req.query;

        const result = await spotService.getRecommendedSpots({
            userId,
            page: parseInt(page),
            limit: parseInt(limit),
            filters
        });

        const spotsWithFavorites = await attachFavoriteStatus(result.spots, userId);
        result.spots = spotsWithFavorites;

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting recommended spots:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recommended spots',
            error: error.message
        });
    }
};

// Get trending spots
exports.getTrendingSpots = async (req, res) => {
    try {
        const { page = 1, limit = 10, days = 30, ...filters } = req.query;
        const userId = req.user?.id;

        const result = await spotService.getTrendingSpots({
            page: parseInt(page),
            limit: parseInt(limit),
            days: parseInt(days),
            filters
        });

        const spotsWithFavorites = await attachFavoriteStatus(result.spots, userId);
        result.spots = spotsWithFavorites;

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting trending spots:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving trending spots',
            error: error.message
        });
    }
};

// Controller to get a random recommended spot
exports.getRandomSpot = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Get a random recommended spot
        const spot = await spotService.getRandomRecommendedSpot(userId);

        if (!spot) {
            return res.status(404).json({
                success: false,
                message: 'No spots available'
            });
        }

        // Attach favorite status if user is authenticated
        const spotWithFavorite = userId
            ? await attachFavoriteStatus(spot, userId)
            : spot;

        // If user is authenticated, try to award points
        let pointsAwarded = null;
        if (userId) {
            try {
                const pointTransactionService = require('../services/pointTransaction.service');
                const transaction = await pointTransactionService.awardRandomSpotPoints(userId, spot._id);
                pointsAwarded = {
                    amount: transaction.amount,
                    message: `You earned ${transaction.amount} points for discovering a random spot!`
                };
            } catch (error) {
                // If user already received points today, just ignore
                if (!error.message.includes('already received')) {
                    console.error('Error awarding random spot points:', error);
                }
            }
        }

        res.status(200).json({
            success: true,
            spot: spotWithFavorite,
            pointsAwarded
        });
    } catch (error) {
        console.error('Error getting random spot:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving random spot',
            error: error.message
        });
    }
};