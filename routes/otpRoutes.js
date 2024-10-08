const express = require('express');
const { createOtp, verifyOtp, deleteOtp } = require('../controllers/otp.controller');
const authenticateUser = require('../middleware/auth');  // Authentication middleware
const router = express.Router();

// Route to generate an OTP
router.post('/create', authenticateUser, createOtp);

// Route to verify an OTP
router.post('/verify', authenticateUser, verifyOtp);

// Route to delete an OTP
router.delete('/delete', authenticateUser, deleteOtp);

module.exports = router;
