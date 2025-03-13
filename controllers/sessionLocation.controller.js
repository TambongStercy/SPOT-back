const sessionLocationService = require('../services/sessionLocation.service');

// Controller for getting user's session history
exports.getSessionHistory = async (req, res) => {
    try {
        const { startDate, endDate, limit, eventType } = req.query;

        const sessionHistory = await sessionLocationService.getUserSessionHistory(
            req.user.id,
            {
                startDate,
                endDate,
                limit: limit ? parseInt(limit) : undefined,
                eventType
            }
        );

        res.json({ sessionHistory });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting device session history
exports.getDeviceSessionHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { startDate, endDate, limit, eventType } = req.query;

        // Verify that the device belongs to the user
        const sessionHistory = await sessionLocationService.getDeviceSessionHistory(
            deviceId,
            {
                startDate,
                endDate,
                limit: limit ? parseInt(limit) : undefined,
                eventType
            }
        );

        res.json({ sessionHistory });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
}; 