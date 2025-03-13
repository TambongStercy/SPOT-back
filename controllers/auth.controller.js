const authService = require('../services/auth.services');
const otpService = require('../services/otp.services');
const smsService = require('../services/sms.services');
const emailService = require('../services/email.services');
const userService = require('../services/user.services');
const sessionLocationService = require('../services/sessionLocation.service');

// Controller for user registration
exports.register = async (req, res) => {
    try {
        const {
            name, phone, email, password,
            dateOfBirth, sex, avatar, fcmToken,
            deviceInfo, location,
            username, refferalCode
        } = req.body;

        console.log(req.body)

        // Register the user
        const { accessToken, user, userDevice } = await authService.register({
            name, phone, email, password,
            dateOfBirth, sex, avatar,
            fcmToken, deviceInfo,
            username, refferalCode
        });

        // Record session event
        if (deviceInfo) {
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                userDeviceId: userDevice._id, // First device created during registration
                eventType: 'signup',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        // Generate OTP for phone verification
        const otp = await otpService.generateOtp(user._id);

        // Send verification email
        const emailContent = emailService.otpVerifyMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

        res.json({
            msg: 'Registration successful. Please verify your phone number.',
            accessToken,
            user
        });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller for user login
exports.login = async (req, res) => {
    try {
        const { email, phone, password, fcmToken, deviceInfo, location } = req.body;
        const { accessToken, user, userDevice } = await authService.login({
            email, phone, password, fcmToken, deviceInfo
        });

        // Record session event
        if (deviceInfo) {
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                userDeviceId: userDevice._id,
                eventType: 'login',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({
            msg: 'Login successful',
            accessToken,
            user,
        });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to refresh access token
exports.refreshToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const { accessToken } = await authService.refreshToken(fcmToken);
        res.json({ accessToken });
    } catch (err) {
        res.status(401).json({ msg: err.message });
    }
};

// Controller to logout a user
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fcmToken, deviceInfo, location } = req.body;
        const userDevice = await authService.logout(userId, fcmToken);

        // Record session event
        if (deviceInfo) {
            await sessionLocationService.recordSessionEvent({
                userId,
                userDeviceId: userDevice._id,
                eventType: 'logout',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({ msg: 'User logged out successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to logout from all devices(Returns the device that initiated the logout if fcmToken is provided)
exports.logoutAll = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fcmToken, deviceInfo, location } = req.body;

        const userDevice = await authService.logoutAll(userId, fcmToken);


        // Record session event
        if (deviceInfo) {
            await sessionLocationService.recordSessionEvent({
                userId,
                userDeviceId: userDevice._id,
                eventType: 'logout',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({ msg: 'Logged out from all devices successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to get user's active devices
exports.getUserDevices = async (req, res) => {
    try {
        const userId = req.user.id;
        const devices = await authService.getUserDevices(userId);
        res.json({ devices });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller for forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email, deviceInfo, location } = req.body;
        const user = await userService.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate OTP
        const otp = await otpService.generateOtp(user._id);

        // Send OTP email
        const emailContent = emailService.otpPasswordMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

        // Record session event if location is provided
        if (deviceInfo) {
            // Use the first device for recording the event
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                eventType: 'forgotPassword',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({ msg: 'Password reset OTP sent to email' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Verify OTP for forgot password
exports.verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userService.getUserByEmail(email);

        const isValid = await otpService.verifyOtp(user._id, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        res.json({ msg: 'OTP verified successfully' });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Reset password after OTP verification
exports.resetForgotPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, deviceInfo, location } = req.body;
        const user = await userService.getUserByEmail(email);

        // Verify OTP again for security
        const isValid = await otpService.verifyOtp(user._id, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Reset password
        await userService.resetPassword(user._id, newPassword);

        // Delete OTP after successful password reset
        await otpService.deleteOtp(user._id);

        // Record session event if location is provided
        if (deviceInfo) {
            // Use the first device for recording the event
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                eventType: 'resetPassword',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        // Logout from all devices for security
        await authService.logoutAll(user._id);

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Request email verification
exports.requestEmailVerification = async (req, res) => {
    try {
        const { email, deviceInfo, location } = req.body;
        const user = await userService.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate OTP
        const otp = await otpService.generateOtp(user._id);

        // Send verification email
        const emailContent = emailService.otpVerifyMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

        // Record session event if location is provided
        if (deviceInfo) {
            // Use the first device for recording the event
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                eventType: 'emailVerification',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({ msg: 'Email verification OTP sent' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Request phone verification
exports.requestPhoneVerification = async (req, res) => {
    try {
        const { phone, deviceInfo, location } = req.body;
        const user = await userService.getUserByPhone(phone);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const otp = await otpService.generateOtp(user._id);

        // const smsContent = smsService.otpVerifyMessage(user.phone, otp);
        // await smsService.sendSms(smsContent.to, smsContent.message);

        // // Record session event if location is provided
        // if (deviceInfo) {
        //     // Use the first device for recording the event
        //     await sessionLocationService.recordSessionEvent({
        //         userId: user._id,
        //         eventType: 'phoneVerification',
        //         location: location,
        //         deviceInfo: deviceInfo,
        //         ipAddress: req.ip
        //     });
        // }

        const email = user.email;

        // Send verification email
        const emailContent = emailService.otpVerifyMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

        // Record session event if location is provided
        if (deviceInfo) {
            // Use the first device for recording the event
            await sessionLocationService.recordSessionEvent({
                userId: user._id,
                eventType: 'phoneVerification',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }


        res.json({ msg: 'Phone verification OTP sent(Not implemented yet)' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Verify email with OTP
exports.verifyEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        // Verify the code logic here...
        const isValid = await otpService.verifyOtp(userId, code);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }


        // If verification successful, handle the verification
        const result = await authService.handleUserVerification(userId, 'email');

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            user: result.user,
            referralResults: result.referralResults
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Controller for phone verification
exports.verifyPhone = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        // Verify the code logic here...
        const isValid = await otpService.verifyOtp(userId, code);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // If verification successful, handle the verification
        const result = await authService.handleUserVerification(userId, 'phone');

        res.status(200).json({
            success: true,
            message: 'Phone verified successfully',
            user: result.user,
            referralResults: result.referralResults
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Controller to change password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword , deviceInfo, location } = req.body;
        const userId = req.user.id;

        await authService.changePassword({ userId, oldPassword, newPassword });

        // Record session event if location is provided
        if (deviceInfo) {
            // Use the first device for recording the event
            await sessionLocationService.recordSessionEvent({
                userId: userId,
                eventType: 'changePassword',
                location: location,
                deviceInfo: deviceInfo,
                ipAddress: req.ip
            });
        }

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        res.status(err.statusCode || 400).json({ msg: err.message });
    }
};