const express = require('express');
const {
    createOtp,
    verifyOtp,
    deleteOtp,
} = require('../controllers/otp.controller');
const {authenticateUser} = require('../middleware/auth'); // Authentication middleware
const {
    validateGenerateOtp,
    validateVerifyOtp,
    validateDeleteOtp,
} = require('../middleware/otpValidation'); // Validation middleware

const router = express.Router();

// Route to generate an OTP
router.post('/create', authenticateUser, validateGenerateOtp, createOtp);

// Route to verify an OTP
router.post('/verify', authenticateUser, validateVerifyOtp, verifyOtp);

// Route to delete an OTP
router.delete('/delete', authenticateUser, validateDeleteOtp, deleteOtp);

module.exports = router;
