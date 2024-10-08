const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const authenticateUser = require('../middleware/auth');  // Middleware to check if user is authenticated
const router = express.Router();

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

// Logout a user (requires authentication)
router.post('/logout', authenticateUser, logout);


module.exports = router;
