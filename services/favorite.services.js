const Favorite = require('../models/Favorite');
const FavoriteEvent = require('../models/FavoriteEvent');
const { trackFavorite, removeFavoriteActivity } = require('./userActivity.services');

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

    // Track favorite activity
    await trackFavorite(userId, spotId, 'Spot');

    return newFavorite;
};

exports.removeFavoriteSpot = async (userId, spotId) => {
    const favorite = await Favorite.findOneAndDelete({ user: userId, spot: spotId });
    if (!favorite) {
        throw new Error('Spot is not in favorites');
    }

    // Remove favorite activity
    await removeFavoriteActivity(userId, spotId, 'Spot');

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

    // Track favorite activity
    await trackFavorite(userId, eventId, 'Event');

    return newFavorite;
};

exports.removeFavoriteEvent = async (userId, eventId) => {
    const favorite = await FavoriteEvent.findOneAndDelete({ user: userId, event: eventId });
    if (!favorite) {
        throw new Error('Event is not in favorites');
    }

    // Remove favorite activity
    await removeFavoriteActivity(userId, eventId, 'Event');

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
        // Check if these are trending spots (with item and stats structure)
        const isTrendingSpots = spots.length > 0 && spots[0].item && spots[0].stats;

        // Get the actual spot objects, either directly or from the item property
        const spotObjects = isTrendingSpots ? spots.map(s => s.item) : spots;

        const favoriteSpots = await Favorite.find({
            user: userId,
            spot: { $in: spotObjects.map(spot => spot._id) }
        });

        const favoriteSpotIds = new Set(favoriteSpots.map(fav => fav.spot.toString()));

        if (isTrendingSpots) {
            // For trending spots, maintain the structure with item and stats
            return spots.map(trendingSpot => ({
                ...trendingSpot,
                item: {
                    ...trendingSpot.item,
                    isFavorite: favoriteSpotIds.has(trendingSpot.item._id.toString())
                }
            }));
        } else {
            // For regular spots array
            return spots.map(spot => ({
                ...spot,
                isFavorite: favoriteSpotIds.has(spot._id.toString())
            }));
        }
    } else if (spots) {
        // Handle single spot object
        const spotToCheck = spots.item || spots;
        const favorite = await Favorite.findOne({
            user: userId,
            spot: spotToCheck._id
        });

        if (spots.item) {
            // If it's a trending spot with stats
            return {
                ...spots,
                item: {
                    ...spots.item,
                    isFavorite: !!favorite
                }
            };
        } else {
            // If it's a regular spot
            return {
                ...spots,
                isFavorite: !!favorite
            };
        }
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