const express = require('express');
const {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    buyTickets,
    getActiveEvents,
    getEndedEvents,
    getFilteredEvents,
    getRecommendedEvents,
    getTrendingEvents,
    rateEvent,
    getEventRatings,
    getEventRatingStats
} = require('../controllers/event.controller');
const { authenticateUser, optionalAuthenticateUser } = require('../middleware/auth'); // Authentication middleware
const { authorizeRoles } = require('../middleware/authorize'); // Authorization middleware
const {
    validateEvent,
    validateBuyTickets,
    validateRecommendedEvents,
    validateTrendingEvents
} = require('../middleware/eventValidation'); // Validation middleware

const { cache } = require('../config/redis'); // Cache middleware

const router = express.Router();

// Route to create a new event (Admin only)
router.post('/create', authenticateUser, authorizeRoles('admin'), validateEvent, createEvent);

// Route to buy tickets for an event
router.post('/buy-tickets', authenticateUser, validateBuyTickets, buyTickets);

// Route to get recommended events (requires authentication)
router.get('/recommended', authenticateUser, validateRecommendedEvents, getRecommendedEvents);

// Route to get trending events
router.get('/trending', optionalAuthenticateUser, validateTrendingEvents, getTrendingEvents);

// Route to get active events with pagination and filters
router.get('/active', optionalAuthenticateUser, getActiveEvents);

// Route to get ended events with pagination and filters
router.get('/ended', optionalAuthenticateUser, getEndedEvents);

// Route to get filtered events
router.get('/', optionalAuthenticateUser, getFilteredEvents);

// Route to get an event by ID (No validation needed)
router.get('/:id', optionalAuthenticateUser, getEventById);

// Route to update an event by ID (Admin only)
router.put('/:id', authenticateUser, authorizeRoles('admin'), validateEvent, updateEvent);

// Route to delete an event by ID (Admin only)
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteEvent);

// Route to rate an event
router.post('/:id/rate', authenticateUser, rateEvent);

// Route to get all ratings for an event with pagination
router.get('/:id/ratings', cache(300), getEventRatings);

// Route to get rating statistics for an event
router.get('/:id/rating-stats', cache(300), getEventRatingStats);

module.exports = router;
