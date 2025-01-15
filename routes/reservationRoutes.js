const express = require('express');
const { createReservation } = require('../controllers/reservation.controller');
const {authenticateUser} = require('../middleware/auth'); // Authentication middleware
const { validateCreateReservation } = require('../middleware/reservationValidation'); // Validation middleware

const router = express.Router();

// Route to create a new reservation
router.post('/create', authenticateUser, validateCreateReservation, createReservation);

module.exports = router;
