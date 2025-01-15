const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    register,
    login,
    verifyPhone,
    logout,
    logoutAll,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetForgotPassword,
    requestEmailVerification,
    verifyEmail,
    changePassword,
    refreshToken,
    getUserDevices
} = require('../controllers/auth.controller');
const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateEmailVerification,
    validatePhoneVerification,
    validateChangePassword
} = require('../middleware/authValidation');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, auth.loginLimiter, login);
router.post('/refresh-token', auth.refreshTokenLimiter, auth.validateRefreshToken, refreshToken);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-forgot-password', verifyForgotPasswordOtp);
router.post('/reset-forgot-password', resetForgotPassword);
router.post('/request-email-verification', validateEmailVerification, requestEmailVerification);
// router.post('/request-phone-verification', validatePhoneVerification, requestPhoneVerification);
router.post('/verify-email', validateEmailVerification, verifyEmail);
router.post('/verify-phone', validatePhoneVerification, verifyPhone);

// Protected routes (require authentication)
router.post('/logout', auth.authenticateUser, logout);
router.post('/logout-all', auth.authenticateUser, logoutAll);
router.get('/devices', auth.authenticateUser, getUserDevices);
router.post('/change-password', auth.authenticateUser, validateChangePassword, changePassword);

module.exports = router;
