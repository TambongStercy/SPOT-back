const express = require('express');
const {
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    buyTickets,
    getActiveEvents,
    getEndedEvents,
} = require('../controllers/event.controller');
const authenticateUser = require('../middleware/auth'); // Authentication middleware
const authorizeRoles = require('../middleware/authorize'); // Authorization middleware
const {
    validateEvent,
    validateBuyTickets,
    validateEventFilters,
} = require('../middleware/eventValidation'); // Validation middleware

const router = express.Router();

// Route to create a new event (Admin only)
router.post('/create', authenticateUser, authorizeRoles('admin'), validateEvent, createEvent);

// Route to get an event by ID (No validation needed)
router.get('/:id', getEventById);

// Route to update an event by ID (Admin only)
router.put('/:id', authenticateUser, authorizeRoles('admin'), validateEvent, updateEvent);

// Route to delete an event by ID (Admin only)
router.delete('/:id', authenticateUser, authorizeRoles('admin'), deleteEvent);

// Route to buy tickets for an event
router.post('/buy-tickets', authenticateUser, validateBuyTickets, buyTickets);

// Route to get active events with pagination and filters
router.get('/active', validateEventFilters, getActiveEvents);

// Route to get ended events with pagination and filters
router.get('/ended', validateEventFilters, getEndedEvents);

module.exports = router;
