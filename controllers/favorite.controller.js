const favoriteService = require('../services/favorite.services');


// Controller to add a favorite spot
exports.addFavorite = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id;  // Assuming authentication middleware provides the user ID
        const { spotId } = req.params;

        const favorite = await favoriteService.addFavoriteSpot(userId, spotId);
        res.json({ msg: 'Spot added to favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to remove a favorite spot
exports.removeFavorite = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id;  // Assuming authentication middleware provides the user ID
        const { spotId } = req.params;

        const favorite = await favoriteService.removeFavoriteSpot(userId, spotId);
        res.json({ msg: 'Spot removed from favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to get paginated favorite spots for the user
exports.getFavorites = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id; // Assuming authentication middleware provides the user ID
        const { page = 1, limit = 10 } = req.query;  // Extract pagination from query parameters
        const favorites = await favoriteService.getFavoriteSpots(userId, { page: parseInt(page), limit: parseInt(limit) });
        console.log(favorites);
        const spotsWithFavorites = await favoriteService.attachFavoriteStatus(favorites.favorites, userId);
        favorites.favorites = spotsWithFavorites;
        res.json(favorites);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Event favorite controllers
exports.addFavoriteEvent = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id;  // Assuming authentication middleware provides the user ID
        const { eventId } = req.params;

        const favorite = await favoriteService.addFavoriteEvent(userId, eventId);
        res.json({ msg: 'Event added to favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

exports.removeFavoriteEvent = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id;  // Assuming authentication middleware provides the user ID
        const { eventId } = req.params;

        const favorite = await favoriteService.removeFavoriteEvent(userId, eventId);
        res.json({ msg: 'Event removed from favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

exports.getFavoriteEvents = async (req, res) => {
    try {
        const userId = req.params.id??req.user.id; // Assuming authentication middleware provides the user ID
        const { page = 1, limit = 10 } = req.query;  // Extract pagination from query parameters
        const favorites = await favoriteService.getFavoriteEvents(userId, { page: parseInt(page), limit: parseInt(limit) });
        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(favorites.favorites, userId);
        favorites.favorites = eventsWithFavorites;
        res.json(favorites);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
