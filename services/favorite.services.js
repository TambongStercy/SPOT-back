const Favorite = require('../models/Favorite');
const FavoriteEvent = require('../models/FavoriteEvent');

// Spot favorite services
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

exports.removeFavoriteSpot = async (userId, spotId) => {
    const favorite = await Favorite.findOneAndDelete({ user: userId, spot: spotId });
    if (!favorite) {
        throw new Error('Spot is not in favorites');
    }

    return favorite;
};

exports.getFavoriteSpots = async (userId, { page = 1, limit = 10 }) => {
    const query = { user: userId };

    const favorites = await Favorite.find(query)
        .populate('spot')
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec();

    const total = await Favorite.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        favorites: favorites.map(fav => fav.spot)
    };
};

// Event favorite services
exports.addFavoriteEvent = async (userId, eventId) => {
    // Check if the favorite already exists
    const existingFavorite = await FavoriteEvent.findOne({ user: userId, event: eventId });
    if (existingFavorite) {
        throw new Error('Event is already in favorites');
    }

    // Create a new favorite
    const newFavorite = new FavoriteEvent({ user: userId, event: eventId });
    await newFavorite.save();

    return newFavorite;
};

exports.removeFavoriteEvent = async (userId, eventId) => {
    const favorite = await FavoriteEvent.findOneAndDelete({ user: userId, event: eventId });
    if (!favorite) {
        throw new Error('Event is not in favorites');
    }

    return favorite;
};

exports.getFavoriteEvents = async (userId, { page = 1, limit = 10 }) => {
    const query = { user: userId };

    const favorites = await FavoriteEvent.find(query)
        .populate('event')
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec();

    const total = await FavoriteEvent.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        favorites: favorites.map(fav => fav.event)
    };
};

// Helper function to attach favorite status to spots
exports.attachFavoriteStatus = async (spots, userId) => {
    if (!userId) return spots;

    if (Array.isArray(spots)) {
        const favoriteSpots = await Favorite.find({
            user: userId,
            spot: { $in: spots.map(spot => spot._id) }
        });
        
        const favoriteSpotIds = new Set(favoriteSpots.map(fav => fav.spot.toString()));
        
        return spots.map(spot => ({
            ...spot,
            isFavorite: favoriteSpotIds.has(spot._id.toString())
        }));
    } else if (spots) {
        const favorite = await Favorite.findOne({
            user: userId,
            spot: spots._id
        });
        return {
            ...spots,
            isFavorite: !!favorite
        };
    }
    return spots;
};

// Helper function to attach favorite status to events
exports.attachFavoriteStatusEvent = async (events, userId) => {
    if (!userId) return events;

    if (Array.isArray(events)) {
        const favoriteEvents = await FavoriteEvent.find({
            user: userId,
            event: { $in: events.map(event => event._id) }
        });
        
        const favoriteEventIds = new Set(favoriteEvents.map(fav => fav.event.toString()));
        
        return events.map(event => ({
            ...event,
            isFavorite: favoriteEventIds.has(event._id.toString())
        }));
    } else if (events) {
        const favorite = await FavoriteEvent.findOne({
            user: userId,
            event: events._id
        });
        return {
            ...events,
            isFavorite: !!favorite
        };
    }
    return events;
};