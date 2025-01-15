const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const UserDevice = require('../models/UserDevice');

// Load environment variables from .env file
dotenv.config();

// Rate limiter for token refresh
exports.refreshTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many refresh token attempts, please try again later'
});

// Rate limiter for login attempts
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later'
});

// Middleware to optionally authenticate user
exports.optionalAuthenticateUser = async (req, res, next) => {
    try {
        // Get the token from the request headers
        const authHeader = req.headers.authorization;

        // If no token is provided, continue without authentication
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;
        } catch (err) {
            // If token is invalid, continue without authentication
            // We don't send an error because authentication is optional
        }
        next();
    } catch (err) {
        console.error('Optional auth middleware error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Middleware to check if user is authenticated
exports.authenticateUser = async (req, res, next) => {
    try {
        // Get the token from the request headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ msg: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    msg: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({ msg: 'Token is not valid' });
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Middleware to validate refresh token
exports.validateRefreshToken = async (req, res, next) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ msg: 'FCM token is required' });
        }

        // Check if the device exists and is active
        const device = await UserDevice.findOne({ fcmToken, isActive: true });
        if (!device) {
            return res.status(401).json({ msg: 'Invalid refresh token' });
        }

        req.device = device;
        next();
    } catch (err) {
        console.error('Refresh token validation error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
