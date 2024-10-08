const express = require('express');
const { createEvent, getEventById, updateEvent, deleteEvent, buyTickets, getActiveEvents, getEndedEvents  } = require('../controllers/event.controller');
const authenticateUser = require('../middleware/auth');  // Import the authentication middleware
const router = express.Router();

// Route to create a new event
router.post('/create', createEvent);

// Route to get an event by ID
router.get('/:id', getEventById);

// Route to update an event by ID
router.put('/:id', updateEvent);

// Route to delete an event by ID
router.delete('/:id', deleteEvent);

// Route to buy tickets for an event
router.post('/buy-tickets', authenticateUser, buyTickets);

// Route to get active events with pagination and filters
router.get('/active', getActiveEvents);

// Route to get ended events with pagination and filters
router.get('/ended', getEndedEvents);


module.exports = router;
