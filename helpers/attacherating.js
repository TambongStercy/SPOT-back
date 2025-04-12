const { getRatingStats } = require('../services/rating.services');


// Helper function to attach rating stats to spot(s)
/**
 * Attach rating stats to spot(s)
 * @param {Array|Object} spots - The spot(s) to attach rating stats to
 * @returns {Array|Object} The spot(s) with attached rating stats
 */
const attachRatingToSpots = async (spots) => {
    if (Array.isArray(spots)) {
        const spotsWithRating = await Promise.all(spots.map(async (spot) => {
            const spotObj = spot.toObject ? spot.toObject() : spot;
            const stats = await getRatingStats(spot._id, 'spot');
            spotObj.rating = stats.averageRating;
            spotObj.numberOfRatings = stats.numberOfRatings;
            return spotObj;
        }));
        return spotsWithRating;
    } else if (spots) {
        const spotObj = spots.toObject ? spots.toObject() : spots;
        const stats = await getRatingStats(spots._id, 'spot');
        spotObj.rating = stats.averageRating;
        spotObj.numberOfRatings = stats.numberOfRatings;
        return spotObj;
    }
    return null;
};


// Helper function to attach rating information to events
/**
 * Attach rating stats to event(s)
 * @param {Array|Object} events - The event(s) to attach rating stats to
 * @returns {Array|Object} The event(s) with attached rating stats
 */
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

module.exports = { attachRatingToSpots, attachRatingToEvents };