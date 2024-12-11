const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    requestOtp,
    resetPassword,
    verifyEmail,
    modifyUserInfo,
    modifyEmail,
    updateLocation,
    getLocationHistory,
    uploadAvatar,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require('../controllers/user.controller');
const {
    validateRequestOtp,
    validateResetPassword,
    validateVerifyEmail,
    validateModifyUserInfo,
    validateModifyEmail,
    validateUpdateLocation,
    validateUploadAvatar,
    validateGetUsers,
} = require('../middleware/userValidation');
const authenticateUser = require('../middleware/auth'); // Authentication middleware

const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Route to request an OTP
router.post('/request-otp', validateRequestOtp, requestOtp);

// Route to reset password
router.post('/reset-password', authenticateUser, validateResetPassword, resetPassword);

// Route to verify email
router.post('/verify-email', authenticateUser, validateVerifyEmail, verifyEmail);

// Route to modify user information
router.put('/modify-info', authenticateUser, validateModifyUserInfo, modifyUserInfo);

// Route to modify email
router.put('/modify-email', authenticateUser, validateModifyEmail, modifyEmail);

// Route to update user location
router.put('/location', authenticateUser, validateUpdateLocation, updateLocation);

// Route to get location history
router.get('/location-history', authenticateUser, getLocationHistory);

// Route to upload avatar
router.post('/avatar', authenticateUser, upload.single('avatar'), validateUploadAvatar, uploadAvatar);

// Route to get users with pagination and filters
router.get('/', authenticateUser, validateGetUsers, getUsers);

// Route to get a user by ID
router.get('/:id', authenticateUser, getUserById);

// Route to update a user
router.put('/:id', authenticateUser, updateUser);

// Route to delete a user
router.delete('/:id', authenticateUser, deleteUser);

module.exports = router;
