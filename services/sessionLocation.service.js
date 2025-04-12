const SessionLocation = require('../models/SessionLocation');

/**
 * Record a session event with location data
 * @param {Object} data - Session event data
 * @param {String} data.userId - User ID
 * @param {String} data.userDeviceId - User device ID
 * @param {String} data.eventType - Type of event (login, signup, etc.)
 * @param {Array} data.coordinates - [longitude, latitude]
 * @param {Object} data.deviceInfo - Device information
 * @param {String} data.ipAddress - IP address
 * @returns {Promise<Object>} - Saved session location record
 */
exports.recordSessionEvent = async (data) => {
    const { userId, userDeviceId, eventType, location, deviceInfo, ipAddress } = data;

    // Create new session location record
    const sessionLocation = new SessionLocation({
        user: userId,
        userDevice: userDeviceId,
        eventType,
        location: location ?? {
            type: 'Point',
            coordinates: []
        },
        deviceInfo: deviceInfo || {},
        ipAddress
    });

    return await sessionLocation.save();
};

/**
 * @param {String} userId - User ID
 * Get session history for a user with pagination
 * @param {Object} options - Query options
 * @param {Date} options.startDate - Start date for filtering
 * @param {Date} options.endDate - End date for filtering
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Items per page (default: 20)
 * @param {String} options.eventType - Filter by event type
 * @returns {Promise<Object>} - Paginated session history records
 */
exports.getUserSessionHistory = async (userId, options = {}) => {
    const { startDate, endDate, page = 1, limit = 20, eventType } = options;

    const query = { user: userId };

    // Add date range if provided
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Add event type filter if provided
    if (eventType) {
        query.eventType = eventType;
    }

    // Count total matching records
    const total = await SessionLocation.countDocuments(query);

    // Get paginated results
    const sessionHistory = await SessionLocation.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userDevice', 'deviceInfo fcmToken')
        .lean();

    return {
        sessions: sessionHistory,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            hasMore: (page - 1) * limit + sessionHistory.length < total
        }
    };
};

/**
 * Get session history for a specific device with pagination
 * @param {String} userDeviceId - User device ID
 * @param {Object} options - Query options
 * @param {Date} options.startDate - Start date for filtering
 * @param {Date} options.endDate - End date for filtering
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Items per page (default: 20)
 * @param {String} options.eventType - Filter by event type
 * @returns {Promise<Object>} - Paginated session history records
 */
exports.getDeviceSessionHistory = async (userDeviceId, options = {}) => {
    const { startDate, endDate, page = 1, limit = 20, eventType } = options;

    const query = { userDevice: userDeviceId };

    // Add date range if provided
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Add event type filter if provided
    if (eventType) {
        query.eventType = eventType;
    }

    // Count total matching records
    const total = await SessionLocation.countDocuments(query);

    // Get paginated results
    const sessionHistory = await SessionLocation.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return {
        sessions: sessionHistory,
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit),
            hasMore: (page - 1) * limit + sessionHistory.length < total
        }
    };
}; 