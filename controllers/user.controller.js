const userService = require('../services/user.services');
const otpService = require('../services/otp.services');
const emailService = require('../services/email.services');
const referralService = require('../services/referral.service');

// Controller to handle general OTP requests with a reason field
exports.requestOtp = async (req, res) => {
    try {
        const { email, reason } = req.body;

        // Valid reasons for OTP
        const validReasons = ['modify-email', 'update-info', 'reset-password', 'verify-email'];

        // Retrieve the user by email
        const user = await userService.getUserByEmail(email);

        // Generate OTP
        const otp = await otpService.generateOtp(user._id, user.email);

        // Send the appropriate OTP email based on the reason or fallback to generic message
        let emailContent;
        if (validReasons.includes(reason)) {
            switch (reason) {
                case 'reset-password':
                    emailContent = emailService.otpPasswordMessage(user.email, otp);
                    break;
                case 'update-info':
                    emailContent = emailService.otpUpdateMessage(user.email, otp);
                    break;
                case 'verify-email':
                    emailContent = emailService.otpVerifyMessage(user.email, otp);
                    break;
                case 'modify-email':
                    emailContent = emailService.otpModifyEmailMessage(user.email, otp);
                    break;
            }
        } else {
            emailContent = emailService.otpMessage(user.email, otp);  // Fallback generic OTP message
        }

        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);
        res.json({ msg: 'OTP sent successfully for ' + reason });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to reset password after OTP verification
exports.resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const userId = req.user.id;  // Assuming user is authenticated

        // Verify OTP
        await otpService.verifyOtp(userId, otp);

        // Reset password
        await userService.resetPassword(userId, newPassword);

        // Delete the OTP
        await otpService.deleteOtp(userId);

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        // Verify OTP
        await otpService.verifyOtp(userId, otp);

        // Mark email as verified
        await userService.verifyEmail(userId);

        // Delete OTP
        await otpService.deleteOtp(userId);

        res.json({ msg: 'Email verified successfully' });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to modify user info (e.g., name, avatar)
exports.modifyUserInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        const user = await userService.updateUserInfo(userId, updates);
        res.json({ msg: 'User info updated successfully', user });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to modify email (after OTP verification)
exports.modifyEmail = async (req, res) => {
    try {
        const { otp, newEmail } = req.body;
        const userId = req.user.id;

        // Verify OTP
        await otpService.verifyOtp(userId, otp);

        // Update email and reset verification status
        const user = await userService.modifyEmail(userId, newEmail);

        // Delete OTP
        await otpService.deleteOtp(userId);

        res.json({ msg: 'Email updated successfully', user });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller for updating user's location
exports.updateLocation = async (req, res) => {
    try {
        const { lon, lat, fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ msg: 'FCM Token is required' });
        }

        const result = await userService.updateUserLocation({
            userId: req.user.id,
            fcmToken,
            lon,
            lat
        });

        res.json({
            msg: 'Location updated successfully',
            location: result.locationHistory,
            userLocation: result.user.location
        });
    } catch (err) {
        // Handle specific error cases
        if (err.message.includes('Device not found')) {
            return res.status(404).json({ msg: err.message });
        }
        if (err.message.includes('not registered to your account')) {
            return res.status(403).json({ msg: err.message });
        }
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting user's location history
exports.getLocationHistory = async (req, res) => {
    try {
        const { startDate, endDate, limit, fcmToken } = req.query;


        const locationHistory = await userService.getUserLocationHistory(
            req.user.id,
            {
                startDate,
                endDate,
                limit: limit ? parseInt(limit) : undefined,
                fcmToken
            }
        );

        res.json({ locationHistory });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting user's session history
exports.getSessionHistory = async (req, res) => {
    try {
        const { startDate, endDate, limit, eventType } = req.query;

        const sessionLocationService = require('../services/sessionLocation.service');
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

        const sessionLocationService = require('../services/sessionLocation.service');
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

// Controller for getting latest locations for all user's devices
exports.getDevicesLatestLocations = async (req, res) => {
    try {
        const latestLocations = await userService.getUserDevicesLatestLocations(req.user.id);
        res.json({ latestLocations });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to upload and update the user's avatar
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming user authentication middleware provides the user ID
        const file = req.file;  // Multer stores the file in req.file

        if (!file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await userService.uploadUserAvatar(userId, file);
        res.json({ msg: 'Avatar uploaded successfully', avatar: user.avatar });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get multiple users with pagination, filters, and rankings
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'points', order = 'desc', ...filters } = req.query;

        const result = await userService.getUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            filters,
            sortBy,
            order
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get a user by ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserById(userId);
        res.json(user);
    } catch (err) {
        res.status(404).json({ msg: err.message });
    }
};

// Controller to update a user
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        const user = await userService.updateUser(userId, updates);
        res.json({ msg: 'User updated successfully', user });
    } catch (err) {
        res.status(404).json({ msg: err.message });
    }
};

// Controller to delete a user
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.deleteUser(userId);
        res.json({ msg: 'User deleted successfully', user });
    } catch (err) {
        res.status(404).json({ msg: err.message });
    }
};

// Controller for updating user's current location only
exports.updateCurrentLocation = async (req, res) => {
    try {
        const { lon, lat, fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ msg: 'FCM Token is required' });
        }

        const result = await userService.updateUserCurrentLocation({
            userId: req.user.id,
            fcmToken,
            lon,
            lat
        });

        res.json({
            msg: 'Location updated successfully',
            currentLocation: result.currentLocation,
            userLocation: result.user.location
        });
    } catch (err) {
        // Handle specific error cases
        if (err.message.includes('Device not found')) {
            return res.status(404).json({ msg: err.message });
        }
        if (err.message.includes('not registered to your account')) {
            return res.status(403).json({ msg: err.message });
        }
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get latest locations for all user devices
exports.getUserDevicesLatestLocations = async (req, res) => {
    try {
        const userId = req.user.id;

        const latestLocations = await userService.getUserDevicesLatestLocations(userId);

        res.json({
            msg: 'User devices latest locations retrieved successfully',
            devices: latestLocations
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to logout a specific device
exports.logoutDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ msg: 'FCM Token is required' });
        }

        await userService.logoutDevice(userId, fcmToken);

        res.json({ msg: 'Device logged out successfully' });
    } catch (err) {
        // Handle specific error cases
        if (err.message.includes('Device not found')) {
            return res.status(404).json({ msg: err.message });
        }
        if (err.message.includes('not registered to your account')) {
            return res.status(403).json({ msg: err.message });
        }
        res.status(500).json({ msg: err.message });
    }
};

// Controller for getting user's recently opened spots and events
exports.getRecentlyOpenedItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemType, page, limit } = req.query;

        const userActivityService = require('../services/userActivity.services');
        const recentlyOpenedItems = await userActivityService.getUserRecentlyOpenedItems(
            userId,
            {
                itemType,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined
            }
        );

        res.status(200).json({
            success: true,
            ...recentlyOpenedItems
        });
    } catch (err) {
        console.error('Error fetching recently opened items:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recently opened items',
            error: err.message
        });
    }
};

// Controller to validate a referral code
exports.validateReferralCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Referral code is required'
            });
        }

        const result = await referralService.validateReferralCode(code);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error validating referral code:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to validate referral code',
            error: err.message
        });
    }
};