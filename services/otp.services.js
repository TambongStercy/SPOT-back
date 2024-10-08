const Otp = require('../models/Otp');
const crypto = require('crypto');
const emailService = require('./email.services');

// Service to generate a new OTP
exports.generateOtp = async (userId) => {
    // Generate a random 6-digit OTP
    const otp = (crypto.randomInt(100000, 999999)).toString();

    // Set the OTP to expire in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in the database
    const newOtp = new Otp({ userId, otp, expiresAt });
    await newOtp.save();

    return otp;  // Return the generated OTP
};

// Service to verify the OTP
exports.verifyOtp = async (userId, providedOtp) => {
    const otpRecord = await Otp.findOne({ userId }).sort({ createdAt: -1 });  // Get the latest OTP

    if (!otpRecord) {
        throw new Error('No OTP found');
    }

    // Check if the OTP has expired
    if (otpRecord.expiresAt < new Date()) {
        throw new Error('OTP has expired');
    }

    // Verify the provided OTP
    if (otpRecord.otp !== providedOtp) {
        throw new Error('Invalid OTP');
    }

    // OTP is valid, return true
    return true;
};

// Service to delete an OTP after use or expiration
exports.deleteOtp = async (userId) => {
    await Otp.deleteMany({ userId });  // Delete all OTPs for the user
    return true;
};


