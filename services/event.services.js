const Event = require('../models/Event');

// Create a new event
exports.createEvent = async (eventData) => {
    try {
        const newEvent = new Event(eventData);
        await newEvent.save();
        return newEvent;
    } catch (error) {
        error.statusCode = 400;
        throw error;
    }
};

// Get an event by ID
exports.getEventById = async (eventId) => {
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        return event;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Update an event by ID
exports.updateEvent = async (eventId, updates) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            updates,
            { new: true, runValidators: true }
        );
        if (!updatedEvent) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        return updatedEvent;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 400;
        throw error;
    }
};

// Delete an event by ID
exports.deleteEvent = async (eventId) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(eventId);
        if (!deletedEvent) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }
        return deletedEvent;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Buy tickets for an event
exports.buyTickets = async (userId, eventId, quantity) => {
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }

        event.tickets.push({
            user: userId,
            quantity
        });
        await event.save();

        return event;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 400;
        throw error;
    }
};

// Service to get active events with pagination and filters
exports.getActiveEvents = async ({ page = 1, limit = 10, filters = {} }) => {
    try {
        // Convert page and limit to numbers
        page = Number(page);
        limit = Number(limit);

        // Validate pagination parameters
        if (isNaN(page) || page < 1) {
            const error = new Error('Invalid page number');
            error.statusCode = 400;
            throw error;
        }
        if (isNaN(limit) || limit < 1) {
            const error = new Error('Invalid limit number');
            error.statusCode = 400;
            throw error;
        }

        // Create a query for events that haven't ended yet
        const currentDate = new Date();
        const query = { 
            endDate: { $gte: currentDate },
            launchDate: { $lte: currentDate }
        };

        // Apply filters
        if (filters.name) {
            query.name = { $regex: filters.name, $options: 'i' };
        }

        if (filters.venue) {
            query.venue = { $regex: filters.venue, $options: 'i' };
        }

        if (filters.categories) {
            query.categories = Array.isArray(filters.categories)
                ? { $in: filters.categories }
                : filters.categories;
        }
        
        if (filters.location) {
            try {
                const locationCoords = Array.isArray(filters.location) 
                    ? filters.location 
                    : JSON.parse(filters.location);

                if (!Array.isArray(locationCoords) || locationCoords.length !== 2 || 
                    !locationCoords.every(coord => !isNaN(parseFloat(coord)))) {
                    const error = new Error('Invalid location format. Expected [longitude, latitude]');
                    error.statusCode = 400;
                    throw error;
                }

                query['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: locationCoords.map(coord => parseFloat(coord))
                        },
                        $maxDistance: parseFloat(filters.radius) || 10000 // Default 10km radius
                    }
                };
            } catch (err) {
                const error = new Error('Invalid location data: ' + err.message);
                error.statusCode = 400;
                throw error;
            }
        }

        // First check if we have any events at all
        const total = await Event.countDocuments(query);
        
        if (total === 0) {
            return {
                totalPages: 0,
                currentPage: page,
                totalEvents: 0,
                events: []
            };
        }

        const events = await Event.find(query)
            .sort({ launchDate: 1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean()
            .exec();

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalEvents: total,
            events
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = `Database error: ${error.message}`;
        }
        throw error;
    }
};

// Service to get ended events with pagination and filters
exports.getEndedEvents = async ({ page = 1, limit = 10, filters = {} }) => {
    try {
        const query = { endDate: { $lt: new Date() } };

        // Apply filters
        if (filters.name) {
            query.name = { $regex: filters.name, $options: 'i' };
        }

        if (filters.venue) {
            query.venue = { $regex: filters.venue, $options: 'i' };
        }

        if (filters.categories) {
            query.categories = Array.isArray(filters.categories)
                ? { $in: filters.categories }
                : filters.categories;
        }

        if (filters.location) {
            try {
                const locationCoords = Array.isArray(filters.location) 
                    ? filters.location 
                    : JSON.parse(filters.location);

                query['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: locationCoords.map(coord => parseFloat(coord))
                        },
                        $maxDistance: parseFloat(filters.radius) || 10000
                    }
                };
            } catch (err) {
                const error = new Error('Invalid location data: ' + err.message);
                error.statusCode = 400;
                throw error;
            }
        }

        const total = await Event.countDocuments(query);
        
        const events = await Event.find(query)
            .sort({ endDate: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean()
            .exec();

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalEvents: total,
            events
        };
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Service to get filtered events
exports.getFilteredEvents = async ({ page = 1, limit = 10, filters = {} }) => {
    try {
        const query = {};

        // Add text search across multiple fields
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { venue: { $regex: filters.search, $options: 'i' } },
                { locationDescription: { $regex: filters.search, $options: 'i' } }
            ];
        } else {
            // Apply individual field filters if no general search
            if (filters.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            if (filters.venue) {
                query.venue = { $regex: filters.venue, $options: 'i' };
            }
        }

        if (filters.categories) {
            query.categories = Array.isArray(filters.categories)
                ? { $in: filters.categories }
                : filters.categories;
        }

        if (filters.location) {
            try {
                const locationCoords = Array.isArray(filters.location) 
                    ? filters.location 
                    : JSON.parse(filters.location);

                query['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: locationCoords.map(coord => parseFloat(coord))
                        },
                        $maxDistance: parseFloat(filters.radius) || 10000
                    }
                };
            } catch (err) {
                const error = new Error('Invalid location data: ' + err.message);
                error.statusCode = 400;
                throw error;
            }
        }

        if (filters.startDate) {
            query.launchDate = { $gte: new Date(filters.startDate) };
        }

        if (filters.endDate) {
            query.endDate = { $lte: new Date(filters.endDate) };
        }

        const total = await Event.countDocuments(query);

        const events = await Event.find(query)
            .sort({ launchDate: 1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean()
            .exec();

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalEvents: total,
            events
        };
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};



