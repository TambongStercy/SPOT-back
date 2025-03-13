const eventService = require('../services/event.services');
const favoriteService = require('../services/favorite.services');
const pointTransactionService = require('../services/pointTransaction.service');
const ratingService = require('../services/rating.services');

// Controller to create a new event
exports.createEvent = async (req, res, next) => {
    try {
        const event = await eventService.createEvent(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Event created successfully',
            event
        });
    } catch (err) {
        next(err);
    }
};

// Controller to get an event by ID
exports.getEventById = async (req, res, next) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        const userId = req.user?.id;
        const eventWithFavorites = await favoriteService.attachFavoriteStatusEvent(event, userId);
        res.json({
            status: 'success',
            event: eventWithFavorites
        });
    } catch (err) {
        next(err);
    }
};

// Controller to update an event
exports.updateEvent = async (req, res, next) => {
    try {
        const event = await eventService.updateEvent(req.params.id, req.body);
        res.json({
            status: 'success',
            message: 'Event updated successfully',
            event
        });
    } catch (err) {
        next(err);
    }
};

// Controller to delete an event
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await eventService.deleteEvent(req.params.id);
        res.json({
            status: 'success',
            message: 'Event deleted successfully',
            event
        });
    } catch (err) {
        next(err);
    }
};

// Controller to buy tickets
exports.buyTickets = async (req, res, next) => {
    try {
        const { eventId, quantity } = req.body;
        const userId = req.user.id;
        const event = await eventService.buyTickets(userId, eventId, quantity);
        res.json({
            status: 'success',
            message: `Successfully bought ${quantity} ticket(s)`,
            event
        });
    } catch (err) {
        next(err);
    }
};

// Get active events
exports.getActiveEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
        const userId = req.user?.id;

        const eventData = await eventService.getActiveEvents(filters, { page, limit });

        eventData.events = await favoriteService.attachFavoriteStatusEvent(eventData.events, userId);

        res.status(200).json({
            status: 'success',
            ...eventData
        });
    } catch (error) {
        console.error('Error getting active events:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            statusCode: error.statusCode || 500,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get ended events
exports.getEndedEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
        const userId = req.user?.id;

        const eventData = await eventService.getEndedEvents(filters, { page, limit });

        eventData.events = await favoriteService.attachFavoriteStatusEvent(eventData.events, userId);

        res.status(200).json({
            status: 'success',
            ...eventData
        });
    } catch (error) {
        console.error('Error getting ended events:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            statusCode: error.statusCode || 500,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get filtered events
exports.getFilteredEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
        const userId = req.user ? req.user.id : null;

        const eventData = await eventService.getFilteredEvents({
            page,
            limit,
            filters,
            userId
        });

        eventData.events = await favoriteService.attachFavoriteStatusEvent(eventData.events, userId);

        res.status(200).json({
            status: 'success',
            ...eventData
        });
    } catch (error) {
        console.error('Error getting filtered events:', error);
        res.status(error.statusCode || 500).json({
            status: 'error',
            statusCode: error.statusCode || 500,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get recommended events
exports.getRecommendedEvents = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, ...filters } = req.query;

        const result = await eventService.getRecommendedEvents({
            userId,
            page: parseInt(page),
            limit: parseInt(limit),
            filters
        });

        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(result.events, userId);
        result.events = eventsWithFavorites;

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting recommended events:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recommended events',
            error: error.message
        });
    }
};

// Get trending events
exports.getTrendingEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, days = 30, ...filters } = req.query;
        const userId = req.user?._id;

        const result = await eventService.getTrendingEvents({
            page: parseInt(page),
            limit: parseInt(limit),
            days: parseInt(days),
            filters
        });

        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(result.events, userId);
        result.events = eventsWithFavorites;

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting trending events:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving trending events',
            error: error.message
        });
    }
};

// Controller to rate an event
exports.rateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!rating || rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }

        const newRating = await ratingService.rateEvent({
            eventId: id,
            userId,
            rating,
            review
        });

        // // Award points for rating (10 points for rating, extra 5 if review is provided)
        // try {
        //     const pointsAmount = review && review.trim().length > 0 ? 15 : 10;

        //     // For events, we'll use the same method but with a different reason
        //     await pointTransactionService.awardPointsFromEvent({
        //         userId,
        //         eventId: id, // Using the event ID in place of spot ID
        //         amount: pointsAmount,
        //         reason: 'event-rating'
        //     });

        //     // Add points info to response
        //     newRating.pointsAwarded = {
        //         amount: pointsAmount,
        //         message: `You earned ${pointsAmount} points for rating this event!`
        //     };
        // } catch (error) {
        //     console.error('Error awarding points for event rating:', error);
        //     // Don't fail the rating if points award fails
        // }

        res.status(201).json(newRating);
    } catch (err) {
        console.error('Error rating event:', err);
        res.status(500).json({ error: 'Failed to rate event' });
    }
};

// Controller to get all ratings for an event with pagination
exports.getEventRatings = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const ratingData = await ratingService.getEventRatings(id, parseInt(page), parseInt(limit));
        res.status(200).json(ratingData);
    } catch (err) {
        console.error('Error fetching event ratings:', err);
        res.status(500).json({ error: 'Failed to fetch ratings' });
    }
};

// Controller to get rating statistics for an event
exports.getEventRatingStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await ratingService.getEventRatingStats(id);
        res.status(200).json(stats);
    } catch (err) {
        console.error('Error fetching event rating stats:', err);
        res.status(500).json({ error: 'Failed to fetch rating statistics' });
    }
};
