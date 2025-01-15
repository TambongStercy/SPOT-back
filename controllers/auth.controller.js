const authService = require('../services/auth.services');
const otpService = require('../services/otp.services');
const emailService = require('../services/email.services');
const userService = require('../services/user.services');

// Controller for user registration
exports.register = async (req, res) => {
    try {
        const { 
            name, phone, email, password, 
            dateOfBirth, sex, avatar, fcmToken, 
            deviceInfo 
        } = req.body;
        
        console.log(req.body)

        // Register the user
        const { accessToken, user } = await authService.register({ 
            name, phone, email, password, 
            dateOfBirth, sex, avatar, 
            fcmToken, deviceInfo 
        });

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
        const { email, phone, password, fcmToken, deviceInfo } = req.body;
        const { accessToken, user } = await authService.login({ 
            email, phone, password, fcmToken, deviceInfo 
        });
        res.json({ accessToken, user });
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

// Controller for phone verification
exports.verifyPhone = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        // Verify OTP
        const isValid = await otpService.verifyOtp(userId, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Mark phone as verified
        const user = await authService.verifyPhone(userId);
        
        // Delete the OTP
        await otpService.deleteOtp(userId);

        res.json({ msg: 'Phone number verified successfully', user });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to logout a user
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fcmToken } = req.body;
        await authService.logout(userId, fcmToken);
        res.json({ msg: 'User logged out successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to logout from all devices
exports.logoutAll = async (req, res) => {
    try {
        const userId = req.user.id;
        await authService.logoutAll(userId);
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

// Forgot password initiation
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userService.getUserByEmail(email);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate OTP
        const otp = await otpService.generateOtp(user._id);
        
        // Send OTP email
        const emailContent = emailService.otpPasswordMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

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
        const { email, otp, newPassword } = req.body;
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
        const { email } = req.body;
        const user = await userService.getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate OTP
        const otp = await otpService.generateOtp(user._id);
        
        // Send verification email
        const emailContent = emailService.otpVerifyMessage(email, otp);
        await emailService.sendEmail(emailContent.to, emailContent.subject, emailContent.html);

        res.json({ msg: 'Email verification OTP sent' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Verify email with OTP
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userService.getUserByEmail(email);

        // Verify OTP
        const isValid = await otpService.verifyOtp(user._id, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Mark email as verified
        await userService.verifyEmail(user._id);
        
        // Delete OTP after successful verification
        await otpService.deleteOtp(user._id);

        res.json({ msg: 'Email verified successfully' });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to change password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        await authService.changePassword({ userId, oldPassword, newPassword });
        
        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        res.status(err.statusCode || 400).json({ msg: err.message });
    }
};