const Favorite = require('../models/Favorite');

// Service to add a favorite spot
exports.addFavoriteSpot = async (userId, spotId) => {
    // Check if the favorite already exists
    const existingFavorite = await Favorite.findOne({ user: userId, spot: spotId });
    if (existingFavorite) {
        throw new Error('Spot is already in favorites');
    }

    // Create a new favorite
    const newFavorite = new Favorite({ user: userId, spot: spotId });
    await newFavorite.save();

    return newFavorite;
};

// Service to remove a favorite spot
exports.removeFavoriteSpot = async (userId, spotId) => {
    const favorite = await Favorite.findOneAndDelete({ user: userId, spot: spotId });
    if (!favorite) {
        throw new Error('Spot is not in favorites');
    }

    return favorite;
};

// Service to get paginated favorite spots for a user
exports.getFavoriteSpots = async (userId, { page = 1, limit = 10 }) => {
    const query = { user: userId };

    const favorites = await Favorite.find(query)
        .populate('spot')
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()  // Use lean() to retrieve plain JS objects
        .exec();

    const total = await Favorite.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        favorites: favorites.map(fav => fav.spot)  // Return the spots
    };
};