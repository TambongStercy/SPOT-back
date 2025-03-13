const {
    trackView,
    trackShare,
    getUserActivities,
    getUserPreferences,
    getRecommendations,
    getTrendingItems
} = require('../services/userActivity.services');

// Track view time for a spot or event
exports.trackViewTime = async (req, res) => {
    try {
        const { itemId, itemType, timeSpentMs } = req.body;
        const userId = req.user.id; // Assuming user is attached by auth middleware

        if (!itemId || !itemType || !timeSpentMs) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: itemId, itemType, or timeSpentMs'
            });
        }

        if (!['Spot', 'Event'].includes(itemType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid itemType. Must be either "Spot" or "Event"'
            });
        }

        if (typeof timeSpentMs !== 'number' || timeSpentMs < 0) {
            return res.status(400).json({
                success: false,
                message: 'timeSpentMs must be a positive number'
            });
        }

        const activity = await trackView(userId, itemId, itemType, timeSpentMs);

        res.status(200).json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Error tracking view time:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking view time',
            error: error.message
        });
    }
};

// Track share activity
exports.trackShare = async (req, res) => {
    try {
        const { itemId, itemType, platform, shareMethod } = req.body;
        const userId = req.user.id;

        if (!itemId || !itemType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: itemId or itemType'
            });
        }

        if (!['Spot', 'Event'].includes(itemType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid itemType. Must be either "Spot" or "Event"'
            });
        }

        const shareMetadata = {
            platform, // e.g., "whatsapp", "facebook", "twitter", etc.
            shareMethod, // e.g., "direct", "link", "story", etc.
            timestamp: new Date()
        };

        const activity = await trackShare(userId, itemId, itemType, shareMetadata);

        res.status(200).json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Error tracking share:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking share activity',
            error: error.message
        });
    }
};

// Get user's activity history
exports.getActivityHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemType, action, page = 1, limit = 10 } = req.query;

        const activities = await getUserActivities(userId, itemType, action);

        // Basic pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedActivities = activities.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            currentPage: parseInt(page),
            totalPages: Math.ceil(activities.length / limit),
            totalActivities: activities.length,
            activities: paginatedActivities
        });
    } catch (error) {
        console.error('Error getting activity history:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving activity history',
            error: error.message
        });
    }
};

// Get user's preferences based on their activities
exports.getUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemType } = req.query;

        if (!itemType || !['Spot', 'Event'].includes(itemType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing itemType. Must be either "Spot" or "Event"'
            });
        }

        const preferences = await getUserPreferences(userId, itemType);

        res.status(200).json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user preferences',
            error: error.message
        });
    }
};

// Get personalized recommendations
exports.getRecommendedItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemType, limit = 10 } = req.query;

        if (!itemType || !['Spot', 'Event'].includes(itemType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing itemType. Must be either "Spot" or "Event"'
            });
        }

        const recommendations = await getRecommendations(userId, itemType, parseInt(limit));

        res.status(200).json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recommendations',
            error: error.message
        });
    }
};

// Get trending items
exports.getTrendingItems = async (req, res) => {
    try {
        const { itemType, days = 30, limit = 10 } = req.query;

        if (!itemType || !['Spot', 'Event'].includes(itemType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing itemType. Must be either "Spot" or "Event"'
            });
        }

        const trending = await getTrendingItems(itemType, parseInt(days), parseInt(limit));

        res.status(200).json({
            success: true,
            trending
        });
    } catch (error) {
        console.error('Error getting trending items:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving trending items',
            error: error.message
        });
    }
}; 