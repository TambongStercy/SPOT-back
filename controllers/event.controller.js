const eventService = require('../services/event.services');
const favoriteService = require('../services/favorite.services');

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

// Controller to get active events with pagination and filters
exports.getActiveEvents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        
        const events = await eventService.getActiveEvents({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            filters: filters || {}
        });
        const userId = req.user?.id;
        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(events.events, userId);
        events.events = eventsWithFavorites;
        
        res.json({
            status: 'success',
            ...events
        });
    } catch (err) {
        next(err);
    }
};

// Controller to get ended events with pagination and filters
exports.getEndedEvents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const events = await eventService.getEndedEvents({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            filters: filters || {}
        });
        const userId = req.user?.id;
        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(events.events, userId);
        events.events = eventsWithFavorites;
        res.json({
            status: 'success',
            ...events
        });
    } catch (err) {
        next(err);
    }
};

// Controller to get filtered events
exports.getFilteredEvents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const result = await eventService.getFilteredEvents({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            filters: filters || {}
        });
        const userId = req.user?.id;
        const eventsWithFavorites = await favoriteService.attachFavoriteStatusEvent(result.events, userId);
        result.events = eventsWithFavorites;
        res.json({
            status: 'success',
            ...result
        });
    } catch (err) {
        next(err);
    }
};
