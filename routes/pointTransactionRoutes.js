const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    validateGetUserTransactions,
    validateAwardRandomSpotPoints
} = require('../middleware/pointTransactionValidation');
const {
    getUserTransactions,
    getUserPointsBalance,
    awardRandomSpotPoints
} = require('../controllers/pointTransaction.controller');
const { cache } = require('../config/redis');

// Get user's point transactions
router.get('/transactions', authenticateUser, validateGetUserTransactions, getUserTransactions);

// Get user's points balance
router.get('/balance', authenticateUser, cache(60), getUserPointsBalance);

// Award points for getting a random spot
router.post('/award/random-spot', authenticateUser, validateAwardRandomSpotPoints, awardRandomSpotPoints);

module.exports = router; 