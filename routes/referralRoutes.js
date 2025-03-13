const express = require('express');
const router = express.Router();
const { authenticateUser, optionalAuthenticateUser } = require('../middleware/auth');
const { validateGetUserReferrals } = require('../middleware/referralValidation');
const {
    getUserReferrals,
    getUserReferrer,
    validateReferralCode
} = require('../controllers/referral.controller');
const { cache } = require('../config/redis');

// Get referrals made by the authenticated user
router.get('/my-referrals', authenticateUser, validateGetUserReferrals, getUserReferrals);

// Get who referred the authenticated user
router.get('/my-referrer', authenticateUser, cache(300), getUserReferrer);

// Validate a referral code (public endpoint)
router.get('/validate/:code', optionalAuthenticateUser, cache(60), validateReferralCode);

module.exports = router; 