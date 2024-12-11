const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const authenticateUser = require('../middleware/auth'); // Authentication middleware
const { validateRegister, validateLogin } = require('../middleware/authValidation'); // Validation middleware
const router = express.Router();

// Register a new user
router.post('/register', validateRegister, register);

// Login a user
router.post('/login', validateLogin, login);

// Logout a user (requires authentication)
router.post('/logout', authenticateUser, logout);

module.exports = router;
