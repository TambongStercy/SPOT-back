const eventService = require('../services/event.services');

// Controller to create a new event
exports.createEvent = async (req, res) => {
    try {
        const event = await eventService.createEvent(req.body);
        res.json({ msg: 'Event created successfully', event });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get an event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        res.json(event);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to update an event
exports.updateEvent = async (req, res) => {
    try {
        const event = await eventService.updateEvent(req.params.id, req.body);
        res.json({ msg: 'Event updated successfully', event });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await eventService.deleteEvent(req.params.id);
        res.json({ msg: 'Event deleted successfully', event });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to buy tickets
exports.buyTickets = async (req, res) => {
    try {
        const { eventId, quantity } = req.body;
        const userId = req.user.id;  // Assuming authentication middleware provides the user ID
        const event = await eventService.buyTickets(userId, eventId, quantity);
        res.json({ msg: `Successfully bought ${quantity} ticket(s)`, event });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get active events with pagination and filters
exports.getActiveEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;  // Extract pagination and filters
        const events = await eventService.getActiveEvents({ page: parseInt(page), limit: parseInt(limit), filters });
        res.json(events);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get ended events with pagination and filters
exports.getEndedEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;  // Extract pagination and filters
        const events = await eventService.getEndedEvents({ page: parseInt(page), limit: parseInt(limit), filters });
        res.json(events);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
