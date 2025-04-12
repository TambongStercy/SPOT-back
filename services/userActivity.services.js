const UserActivity = require('../models/UserActivity');
const mongoose = require('mongoose');

// Create user activity
const createUserActivity = async (userId, itemId, itemType, action, metadata = {}) => {
    try {
        const activity = new UserActivity({
            user: userId,
            item: itemId,
            itemType,
            action,
            metadata
        });
        return await activity.save();
    } catch (error) {
        console.error('Error creating user activity:', error);
        throw error;
    }
};

// Delete user activity
const deleteUserActivity = async (userId, itemId, itemType, action) => {
    try {
        await UserActivity.deleteOne({
            user: userId,
            item: itemId,
            itemType,
            action
        });
    } catch (error) {
        console.error('Error deleting user activity:', error);
        throw error;
    }
};

// Get user activities
const getUserActivities = async (userId, itemType = null, action = null) => {
    try {
        const query = { user: userId };
        if (itemType) query.itemType = itemType;
        if (action) query.action = action;

        return await UserActivity.find(query)
            .sort({ timestamp: -1 })
            .populate('item')
            .exec();
    } catch (error) {
        console.error('Error getting user activities:', error);
        throw error;
    }
};

// Track search activity
const trackSearch = async (userId, itemType, searchQuery) => {
    return await createUserActivity(userId, null, itemType, 'search', { query: searchQuery });
};

// Track opening of a spot/event
const trackOpening = async (userId, itemId, itemType) => {
    return await createUserActivity(userId, itemId, itemType, 'open');
};

// Track actual viewing time of a spot/event
const trackView = async (userId, itemId, itemType, timeSpentMs) => {
    // Cap the time spent at 10 minutes (600000 ms)
    const cappedTimeMs = Math.min(timeSpentMs, 600000);
    return await createUserActivity(userId, itemId, itemType, 'view', {
        timeSpentMs: cappedTimeMs,
        originalTimeMs: timeSpentMs
    });
};

// Track rating activity (converts to like/dislike based on rating value)
const trackRating = async (userId, itemId, itemType, rating) => {
    try {
        // Determine if it's a like or dislike based on rating value
        const action = rating >= 3 ? 'like' : 'dislike';

        await createUserActivity(userId, itemId, itemType, action);

        return { success: true };
    } catch (error) {
        console.error('Error tracking rating:', error);
        return { success: false, error };
    }
};

// Track favorite activity
const trackFavorite = async (userId, itemId, itemType) => {
    return await createUserActivity(userId, itemId, itemType, 'favorite');
};

// Remove favorite activity
const removeFavoriteActivity = async (userId, itemId, itemType) => {
    return await deleteUserActivity(userId, itemId, itemType, 'favorite');
};

// Track share activity
const trackShare = async (userId, itemId, itemType, shareMetadata = {}) => {
    return await createUserActivity(userId, itemId, itemType, 'share', shareMetadata);
};

// Get user preferences based on activities
const getUserPreferences = async (userId, itemType) => {
    try {
        const activities = await UserActivity.find({
            user: userId,
            itemType,
            action: { $in: ['view', 'like', 'favorite', 'open'] }
        }).populate('item');

        const preferences = {
            categories: new Map(),
            types: new Map(),
            towns: new Map()
        };

        activities.forEach(activity => {
            if (!activity.item) return;

            // Weight different actions
            let weight = 1;
            switch (activity.action) {
                case 'favorite': weight = 3; break;
                case 'like': weight = 2; break;
                case 'open': weight = 1; break;
                case 'view':
                    // Add extra weight for longer views (normalized by time spent)
                    const timeSpentMin = (activity.metadata?.timeSpentMs || 0) / 60000; // Convert to minutes
                    weight = 1 + Math.min(timeSpentMin / 10, 1); // Extra weight based on time spent (max +1)
                    break;
            }

            // Track categories
            if (activity.item.categories) {
                activity.item.categories.forEach(category => {
                    preferences.categories.set(
                        category,
                        (preferences.categories.get(category) || 0) + weight
                    );
                });
            }

            // Track type
            if (activity.item.type) {
                preferences.types.set(
                    activity.item.type,
                    (preferences.types.get(activity.item.type) || 0) + weight
                );
            }

            // Track town
            if (activity.item.town) {
                preferences.towns.set(
                    activity.item.town,
                    (preferences.towns.get(activity.item.town) || 0) + weight
                );
            }
        });

        // Convert maps to sorted arrays
        return {
            categories: Array.from(preferences.categories.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([category]) => category),
            types: Array.from(preferences.types.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([type]) => type),
            towns: Array.from(preferences.towns.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([town]) => town)
        };
    } catch (error) {
        console.error('Error getting user preferences:', error);
        throw error;
    }
};

// Get similar users based on preferences
const getSimilarUsers = async (userId, itemType) => {
    try {
        const userPreferences = await getUserPreferences(userId, itemType);
        if (!userPreferences.categories.length) return [];

        // Find users who have similar category preferences
        const similarUsers = await UserActivity.aggregate([
            {
                $match: {
                    user: { $ne: mongoose.Types.ObjectId(userId) },
                    itemType,
                    action: { $in: ['view', 'like', 'favorite'] }
                }
            },
            {
                $lookup: {
                    from: itemType.toLowerCase() + 's', // 'spots' or 'events'
                    localField: 'item',
                    foreignField: '_id',
                    as: 'itemDetails'
                }
            },
            { $unwind: '$itemDetails' },
            {
                $match: {
                    'itemDetails.categories': { $in: userPreferences.categories.slice(0, 5) } // Top 5 categories
                }
            },
            {
                $group: {
                    _id: '$user',
                    commonInterests: { $sum: 1 }
                }
            },
            {
                $sort: { commonInterests: -1 }
            },
            {
                $limit: 10 // Top 10 similar users
            }
        ]);

        return similarUsers.map(user => user._id);
    } catch (error) {
        console.error('Error getting similar users:', error);
        throw error;
    }
};

// Get recommendations based on similar users
const getRecommendations = async (userId, itemType, limit = 10) => {
    try {
        const similarUsers = await getSimilarUsers(userId, itemType);
        if (!similarUsers.length) return [];

        // Get items that similar users have interacted with positively
        const recommendations = await UserActivity.aggregate([
            {
                $match: {
                    user: { $in: similarUsers },
                    itemType,
                    action: { $in: ['like', 'favorite'] }
                }
            },
            {
                $lookup: {
                    from: itemType.toLowerCase() + 's',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'itemDetails'
                }
            },
            { $unwind: '$itemDetails' },
            // Exclude items the user has already interacted with
            {
                $lookup: {
                    from: 'useractivities',
                    let: { itemId: '$item' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$user', mongoose.Types.ObjectId(userId)] },
                                        { $eq: ['$item', '$$itemId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'userInteractions'
                }
            },
            {
                $match: {
                    userInteractions: { $size: 0 }
                }
            },
            {
                $group: {
                    _id: '$item',
                    item: { $first: '$itemDetails' },
                    score: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$action', 'favorite'] }, then: 3 },
                                    { case: { $eq: ['$action', 'like'] }, then: 2 }
                                ],
                                default: 1
                            }
                        }
                    }
                }
            },
            {
                $sort: { score: -1 }
            },
            {
                $limit: limit
            }
        ]);

        return recommendations.map(rec => rec.item);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
};

// Get trending items based on recent activity
const getTrendingItems = async (itemType, days = 30, limit = 10) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

        const trendingItems = await UserActivity.aggregate([
            {
                $match: {
                    itemType,
                    timestamp: { $gte: thirtyDaysAgo },
                    action: { $in: ['view', 'like', 'favorite'] }
                }
            },
            {
                $lookup: {
                    from: itemType.toLowerCase() + 's',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'itemDetails'
                }
            },
            { $unwind: '$itemDetails' },
            {
                $group: {
                    _id: '$item',
                    item: { $first: '$itemDetails' },
                    score: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$action', 'favorite'] }, then: 5 },
                                    { case: { $eq: ['$action', 'like'] }, then: 3 },
                                    { case: { $eq: ['$action', 'view'] }, then: 1 }
                                ],
                                default: 0
                            }
                        }
                    },
                    viewCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] }
                    },
                    likeCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'like'] }, 1, 0] }
                    },
                    favoriteCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'favorite'] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { score: -1 }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 0,
                    item: 1,
                    stats: {
                        score: '$score',
                        views: '$viewCount',
                        likes: '$likeCount',
                        favorites: '$favoriteCount'
                    }
                }
            }
        ]);

        return trendingItems;
    } catch (error) {
        console.error('Error getting trending items:', error);
        throw error;
    }
};

// Get user's recently opened spots and events
const getUserRecentlyOpenedItems = async (userId, options = {}) => {
    try {
        const { itemType, page = 1, limit = 20 } = options;

        // Build query for open activities
        const query = {
            user: userId,
            action: 'open',
            item: { $exists: true, $ne: null } // Ensure the item reference exists
        };

        // Filter by item type if provided (Spot or Event)
        if (itemType && ['Spot', 'Event'].includes(itemType)) {
            query.itemType = itemType;
        }

        // Count total open activities
        const total = await UserActivity.countDocuments(query);


        // Get paginated open activities with populated item data
        const openActivities = await UserActivity.find(query)
            .sort({ timestamp: -1 }) // Most recent first
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'item',
                select: 'name description type location profileImage coverImage' // Select relevant fields
            })
            .lean();


        // Format the recently opened items
        const recentlyOpenedItems = openActivities
            .filter(activity => activity.item) // Filter out any null items (might have been deleted)
            .map(activity => ({
                itemType: activity.itemType,
                timestamp: activity.timestamp,
                item: activity.item,
            }));

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalItems: total,
            items: recentlyOpenedItems,
            hasMore: (page - 1) * limit + recentlyOpenedItems.length < total
        };
    } catch (error) {
        console.error('Error getting user recently opened items:', error);
        throw error;
    }
};

module.exports = {
    createUserActivity,
    deleteUserActivity,
    getUserActivities,
    trackSearch,
    trackOpening,
    trackView,
    trackRating,
    trackFavorite,
    removeFavoriteActivity,
    trackShare,
    getUserPreferences,
    getSimilarUsers,
    getRecommendations,
    getTrendingItems,
    getUserRecentlyOpenedItems
}; 