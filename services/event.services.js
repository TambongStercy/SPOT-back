const Event = require('../models/Event');
const UserActivity = require('../models/UserActivity');
const { paginate } = require('../helpers/paginate');
const { trackSearch, trackOpening, getRecommendations, getTrendingItems, getUserPreferences } = require('./userActivity.services');
const { getRatingStats } = require('./rating.services');
const { queryFromFilter } = require('../helpers/queryfrom');

// Helper function to attach rating information to events
const attachRatingToEvents = async (events) => {
    if (Array.isArray(events)) {
        const eventsWithRating = await Promise.all(events.map(async (event) => {
            const eventObj = event.toObject ? event.toObject() : event;
            const stats = await getRatingStats(event._id, 'event');
            eventObj.rating = stats.averageRating;
            eventObj.numberOfRatings = stats.numberOfRatings;
            return eventObj;
        }));
        return eventsWithRating;
    } else if (events) {
        const eventObj = events.toObject ? events.toObject() : events;
        const stats = await getRatingStats(events._id, 'event');
        eventObj.rating = stats.averageRating;
        eventObj.numberOfRatings = stats.numberOfRatings;
        return eventObj;
    }
    return null;
};

exports.createEvent = async (eventData) => {
    try {
        const newEvent = new Event(eventData);
        await newEvent.save();
        return attachRatingToEvents(newEvent);
    } catch (error) {
        error.statusCode = 400;
        throw error;
    }
};

// Get an event by ID
exports.getEventById = async (eventId, userId = null) => {
    try {
        const event = await Event.findById(eventId).lean();
        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }

        if (userId) {
            // Track opening activity
            await trackOpening(userId, eventId, 'Event');
        }

        return attachRatingToEvents(event);
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Update an event by ID
exports.updateEvent = async (eventId, updates) => {
    try {
        const event = await Event.findByIdAndUpdate(eventId, updates, {
            new: true,
            runValidators: true
        });

        if (!event) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }

        return attachRatingToEvents(event);
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
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

// Get active events with pagination and filters
exports.getActiveEvents = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10 } = pagination;

        // Base query for active events
        const query = {
            launchDate: { $gte: new Date() },
            ...queryFromFilter(filters)
        };

        // Get total count
        const totalEvents = await Event.countDocuments(query);

        // Get paginated events
        const events = await Event.find(query)
            .sort({ date: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Attach ratings to events
        const eventsWithRatings = await attachRatingToEvents(events);

        return {
            events: eventsWithRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents: totalEvents,
            hasMore: (page - 1) * limit + events.length < totalEvents
        };
    } catch (error) {
        console.error('Error getting active events:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Get ended events with pagination and filters
exports.getEndedEvents = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10 } = pagination;

        // Base query for ended events
        const query = {
            endDate: { $lt: new Date() },
            ...queryFromFilter(filters)
        };

        // Get total count
        const totalEvents = await Event.countDocuments(query);

        // Get paginated events
        const events = await Event.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Attach ratings to events
        const eventsWithRatings = await attachRatingToEvents(events);

        return {
            events: eventsWithRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents: totalEvents,
            hasMore: (page - 1) * limit + events.length < totalEvents
        };
    } catch (error) {
        console.error('Error getting ended events:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Get filtered events
exports.getFilteredEvents = async ({ page = 1, limit = 10, filters = {}, userId = null }) => {
    try {
        // Build query from filters
        const query = {};

        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { location: { $regex: filters.search, $options: 'i' } }
            ];

            // Track search if userId is provided
            if (userId) {
                await trackSearch(userId, 'Event', filters.search);
            }
        }

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.date) {
            query.launchDate = { $gte: new Date(filters.date) };
        }

        if (filters.location) {
            query.location = { $regex: filters.location, $options: 'i' };
        }

        if (filters.price) {
            query.ticketPrice = { $lte: parseFloat(filters.price) };
        }

        // Get total count
        const totalEvents = await Event.countDocuments(query);

        // Get paginated events
        const events = await Event.find(query)
            .sort({ launchDate: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Attach ratings to events
        const eventsWithRatings = await attachRatingToEvents(events);

        return {
            events: eventsWithRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents: totalEvents,
            hasMore: (page - 1) * limit + events.length < totalEvents
        };
    } catch (error) {
        console.error('Error getting filtered events:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Fetch nearby spots or events as fallback
exports.getNearbyItems = async (userLocation, maxDistance = 5000, page = 1, limit = 10) => {

    // Geospatial query for nearby items
    const query = Event.find({
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: userLocation },
                $maxDistance: maxDistance
            }
        }
    });

    return await paginate(query, page, limit);
}

// Get recommended events for a user
exports.getRecommendedEvents = async ({ userId, page = 1, limit = 10, filters = {} }) => {
    try {
        // Get recommendations based on user activity
        let recommendations = await getRecommendations(userId, 'Event', limit * 3);

        // If not enough recommendations, try preference-based approach
        if (recommendations.length < limit) {
            const preferences = await getUserPreferences(userId, 'Event');

            // Build query based on user preferences
            const query = {};

            if (preferences.categories && preferences.categories.length > 0) {
                query.category = { $in: preferences.categories };
            }

            // Find events matching preferences
            const preferenceBasedEvents = await Event.find(query)
                .limit(limit * 2)
                .lean();

            // Combine recommendation sets and remove duplicates
            const allRecommendations = [...recommendations];

            preferenceBasedEvents.forEach(event => {
                if (!allRecommendations.some(rec => rec._id.toString() === event._id.toString())) {
                    allRecommendations.push(event);
                }
            });

            recommendations = allRecommendations;
        }

        // Apply additional filters if provided
        let filteredRecommendations = [...recommendations];

        if (filters.category) {
            filteredRecommendations = filteredRecommendations.filter(
                event => event.category === filters.category
            );
        }

        if (filters.location) {
            filteredRecommendations = filteredRecommendations.filter(
                event => event.location && event.location.includes(filters.location)
            );
        }

        // Get total count for pagination
        const totalEvents = filteredRecommendations.length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRecommendations = filteredRecommendations.slice(startIndex, endIndex);

        // Attach ratings to events
        const eventsWithRatings = await attachRatingToEvents(paginatedRecommendations);

        return {
            events: eventsWithRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents: totalEvents,
            hasMore: (page - 1) * limit + paginatedRecommendations.length < totalEvents
        };
    } catch (error) {
        console.error('Error getting recommended events:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Get trending events
exports.getTrendingEvents = async ({ page = 1, limit = 10, days = 30, filters = {} }) => {
    try {
        // Get trending items based on user activity
        const trendingItems = await getTrendingItems('Event', days, limit * 3);

        // Apply filters if provided
        let filteredTrending = [...trendingItems];

        if (filters.category) {
            filteredTrending = filteredTrending.filter(
                trending => trending.item && trending.item.category === filters.category
            );
        }

        if (filters.location) {
            filteredTrending = filteredTrending.filter(
                trending => trending.item && trending.item.location && trending.item.location.includes(filters.location)
            );
        }

        // Get total count for pagination
        const totalEvents = filteredTrending.length;

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTrending = filteredTrending.slice(startIndex, endIndex);

        // Extract events and flatten structure
        const events = paginatedTrending.map(trending => {
            return {
                ...trending.item,
                trendingStats: trending.stats
            };
        });

        // Attach ratings to events
        const eventsWithRatings = await attachRatingToEvents(events);

        return {
            events: eventsWithRatings,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents: totalEvents,
            hasMore: (page - 1) * limit + paginatedTrending.length < totalEvents
        };
    } catch (error) {
        console.error('Error getting trending events:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// Export the attachRatingToEvents function for use in other services
exports.attachRatingToEvents = attachRatingToEvents;



