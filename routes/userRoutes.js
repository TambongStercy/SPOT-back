const express = require('express')
const router = express.Router()
const multer = require('multer');
const fs = require('fs').promises

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {


        const email = req.body.email ?? '';
        const directoryPath = 'public/Profile Pictures/' + email

        // Ensure the directory structure exists
        await fs.mkdir(directoryPath, { recursive: true })


        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Controllers
const {
    updateLocation, getLocationHistory, uploadAvatar, getUsers,
    getUserById, updateUser, deleteUser, requestOtp, 
    resetPassword, verifyEmail, modifyUserInfo, modifyEmail
} = require('../controllers/user.controller.js')

const { addFavorite, removeFavorite, getFavorites } = require('../controllers/favorite.controller.js');

const { testPost, testGet } = require('../controllers/test.controller.js')
const authenticateUser = require('../middleware/auth');  // Import the authentication middleware

// Request OTP (general purpose, for reset password, email verification, etc.)
router.post('/request-otp', requestOtp);

// Reset password (after OTP verification)
router.post('/reset-password', authenticateUser, resetPassword);

// Verify email
router.post('/verify-email', authenticateUser, verifyEmail);

// Modify user info (e.g., name, avatar)
router.put('/modify-info', authenticateUser, modifyUserInfo);

// Modify email (after OTP verification)
router.put('/modify-email', authenticateUser, modifyEmail);


// Route to get multiple users with pagination, filters, and rankings
router.get('/', authenticateUser, getUsers);

// Get a user by ID
router.get('/:id', authenticateUser, getUserById);

// Update a user by ID
router.put('/:id', authenticateUser, updateUser);

// Delete a user by ID
router.delete('/:id', authenticateUser, deleteUser);


// Route for updating the user's location
router.put('/location', authenticateUser, updateLocation);


// Route to upload a user's avatar (requires authentication)
router.post('/avatar', authenticateUser, upload.single('avatar'), uploadAvatar);


// Route for retrieving the user's location history
router.get('/location-history', authenticateUser, getLocationHistory);

// Route to add a spot to the user's favorites
router.post('/favorites/add', authenticateUser, addFavorite);

// Route to remove a spot from the user's favorites
router.post('/favorites/remove', authenticateUser, removeFavorite);

// Route to get all favorite spots for the user
router.get('/favorites', authenticateUser, getFavorites);


router.route('/test').post(testPost)
router.route('/test').get(testGet)

// getRefferedUsers
module.exports = router