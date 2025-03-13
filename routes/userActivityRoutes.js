const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    trackViewTime,
    trackShare,
    getActivityHistory,
    getUserPreferences,
    getRecommendedItems,
    getTrendingItems
} = require('../controllers/userActivity.controller');

// All routes require authentication
router.use(authenticateUser);

// Track view time for a spot or event
router.post('/track-view',  trackViewTime);

// Track share activity
router.post('/track-share', trackShare);

// Get user's activity history with optional filters
router.get('/history', getActivityHistory);

// Get user's preferences based on their activities
router.get('/preferences', getUserPreferences);

// Get personalized recommendations
router.get('/recommendations', getRecommendedItems);

// Get trending items (this doesn't require authentication)
router.get('/trending', getTrendingItems);

module.exports = router; 