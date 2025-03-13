const Rating = require('../models/Rating');
const { trackRating } = require('./userActivity.services');

// Helper function to get rating stats for any entity
const getRatingStats = async (entityId, entityType = 'spot') => {
    try {
        const query = entityType === 'spot' ? { spot: entityId } : { event: entityId };

        const aggregation = await Rating.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    numberOfRatings: { $sum: 1 }
                }
            }
        ]);

        if (aggregation.length === 0) {
            return { averageRating: 0, numberOfRatings: 0 };
        }

        return {
            averageRating: parseFloat(aggregation[0].averageRating.toFixed(1)),
            numberOfRatings: aggregation[0].numberOfRatings
        };
    } catch (error) {
        console.error(`Error getting ${entityType} rating stats:`, error);
        return { averageRating: 0, numberOfRatings: 0 };
    }
};

// Service to rate a spot
exports.rateSpot = async ({ spotId, userId, rating, review }) => {
    // Check if user already rated this spot
    const existingRating = await Rating.findOne({
        spot: spotId,
        user: userId
    });

    if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        existingRating.review = review;
        await existingRating.save();

        // Track the rating activity
        await trackRating(userId, spotId, 'Spot', rating);

        return existingRating;
    }

    // Create new rating
    const newRating = new Rating({
        spot: spotId,
        user: userId,
        rating,
        review
    });

    await newRating.save();

    // Track the rating activity
    await trackRating(userId, spotId, 'Spot', rating);

    return newRating;
};

// Service to rate an event
exports.rateEvent = async ({ eventId, userId, rating, review }) => {
    // Check if user already rated this event
    const existingRating = await Rating.findOne({
        event: eventId,
        user: userId
    });

    if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        existingRating.review = review;
        await existingRating.save();

        // Track the rating activity
        await trackRating(userId, eventId, 'Event', rating);

        return existingRating;
    }

    // Create new rating
    const newRating = new Rating({
        event: eventId,
        user: userId,
        rating,
        review
    });

    await newRating.save();

    // Track the rating activity
    await trackRating(userId, eventId, 'Event', rating);

    return newRating;
};

// Service to get paginated ratings for a spot
exports.getSpotRatings = async (spotId, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const ratings = await Rating.find({ spot: spotId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalRatings = await Rating.countDocuments({ spot: spotId });

        return {
            ratings,
            totalRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRatings / limit),
            hasMore: skip + ratings.length < totalRatings
        };
    } catch (error) {
        console.error('Error getting spot ratings:', error);
        throw error;
    }
};

// Service to get paginated ratings for an event
exports.getEventRatings = async (eventId, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const ratings = await Rating.find({ event: eventId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalRatings = await Rating.countDocuments({ event: eventId });

        return {
            ratings,
            totalRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRatings / limit),
            hasMore: skip + ratings.length < totalRatings
        };
    } catch (error) {
        console.error('Error getting event ratings:', error);
        throw error;
    }
};

// Service to get rating stats for a spot
exports.getSpotRatingStats = async (spotId) => {
    return getRatingStats(spotId, 'spot');
};

// Service to get rating stats for an event
exports.getEventRatingStats = async (eventId) => {
    return getRatingStats(eventId, 'event');
};

// Export the getRatingStats helper for use in other services
exports.getRatingStats = getRatingStats;