const express = require('express');
const { createReservation } = require('../controllers/reservation.controller');
const router = express.Router();

router.post('/create', createReservation);

module.exports = router;
