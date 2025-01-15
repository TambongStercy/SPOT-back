const express = require('express');
const {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    buyTickets,
    getActiveEvents,
    getEndedEvents,
    getFilteredEvents
} = require('../controllers/event.controller');
const {authenticateUser, optionalAuthenticateUser} = require('../middleware/auth'); // Authentication middleware
const authorizeRoles = require('../middleware/authorize'); // Authorization middleware
const {
    validateEvent,
    validateBuyTickets
} = require('../middleware/eventValidation'); // Validation middleware

const router = express.Router();

// Route to create a new event (Admin only)
router.post('/create', authenticateUser, authorizeRoles('admin'), validateEvent, createEvent);

// Route to buy tickets for an event
router.post('/buy-tickets', authenticateUser, validateBuyTickets, buyTickets);

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

module.exports = router;
