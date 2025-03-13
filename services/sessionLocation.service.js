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
 * Get session history for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Date} options.startDate - Start date for filtering
 * @param {Date} options.endDate - End date for filtering
 * @param {Number} options.limit - Maximum number of records to return
 * @param {String} options.eventType - Filter by event type
 * @returns {Promise<Array>} - Session history records
 */
exports.getUserSessionHistory = async (userId, options = {}) => {
    const { startDate, endDate, limit = 50, eventType } = options;

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

    const sessionHistory = await SessionLocation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userDevice', 'deviceInfo fcmToken')
        .lean();

    return sessionHistory;
};

/**
 * Get session history for a specific device(ONLY FOR LOGIN, LOGOUT, REGISTER)
 * @param {String} userDeviceId - User device ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Session history records
 */
exports.getDeviceSessionHistory = async (userDeviceId, options = {}) => {
    const { startDate, endDate, limit = 50, eventType } = options;

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

    const sessionHistory = await SessionLocation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return sessionHistory;
}; 