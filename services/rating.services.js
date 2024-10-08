const Rating = require('../models/Rating');

// Service to rate a spot
exports.rateSpot = async ({ spotId, userId, rating, review }) => {
    const newRating = new Rating({
        spot: spotId,
        user: userId,
        rating,
        review
    });

    await newRating.save();

    return newRating;
};

// Service to get all ratings for a spot
exports.getRatingsForSpot = async (spotId) => {
    const ratings = await Rating.find({ spot: spotId }).populate('user', 'name avatar').sort({ createdAt: -1 });
    return ratings;
};