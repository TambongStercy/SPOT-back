const sessionLocationService = require('../services/sessionLocation.service');

// Controller for getting user's session history
exports.getSessionHistory = async (req, res) => {
    try {
        const { startDate, endDate, limit, page, eventType } = req.query;

        const result = await sessionLocationService.getUserSessionHistory(
            req.user.id,
            {
                startDate,
                endDate,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                eventType
            }
        );

        res.json({
            success: true,
            sessions: result.sessions,
            pagination: result.pagination
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Controller for getting device session history
exports.getDeviceSessionHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, limit, page, eventType } = req.query;

        // Verify that the device belongs to the user
        const result = await sessionLocationService.getDeviceSessionHistory(
            deviceId,
            {
                startDate,
                endDate,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                eventType
            }
        );

        res.json({
            success: true,
            sessions: result.sessions,
            pagination: result.pagination
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}; 