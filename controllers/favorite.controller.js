const favoriteService = require('../services/favorite.services');

// Controller to add a favorite spot
exports.addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming authentication middleware provides the user ID
        const { spotId } = req.body;

        const favorite = await favoriteService.addFavoriteSpot(userId, spotId);
        res.json({ msg: 'Spot added to favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to remove a favorite spot
exports.removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming authentication middleware provides the user ID
        const { spotId } = req.body;

        const favorite = await favoriteService.removeFavoriteSpot(userId, spotId);
        res.json({ msg: 'Spot removed from favorites', favorite });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to get paginated favorite spots for the user
exports.getFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;  // Extract pagination from query parameters
        const favorites = await favoriteService.getFavoriteSpots(req.user.id, { page: parseInt(page), limit: parseInt(limit) });
        res.json(favorites);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
