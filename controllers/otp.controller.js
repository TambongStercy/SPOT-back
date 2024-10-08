const otpService = require('../services/otp.services');

// Controller to generate and send an OTP
exports.createOtp = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming user authentication is in place
        const otp = await otpService.generateOtp(userId);

        // You would typically send the OTP to the user here (e.g., via email or SMS)
        // For now, we'll just return it in the response
        res.json({ msg: 'OTP generated successfully', otp });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// Controller to verify an OTP
exports.verifyOtp = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming user authentication is in place
        const { otp } = req.body;

        const isValid = await otpService.verifyOtp(userId, otp);
        res.json({ msg: 'OTP verified successfully', valid: isValid });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to delete an OTP
exports.deleteOtp = async (req, res) => {
    try {
        const userId = req.user.id;  // Assuming user authentication is in place
        await otpService.deleteOtp(userId);
        res.json({ msg: 'OTP deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
