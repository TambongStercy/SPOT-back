// userService.js
const User = require('../models/User');
const LocationHistory = require('../models/LocationHistory');
const uploadService = require('./upload.services');
const bcrypt = require('bcryptjs');

// Service to reset password after OTP verification
exports.resetPassword = async (userId, newPassword) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return user;
};

// Service to verify email using OTP
exports.verifyEmail = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.verifiedEmail = true;  // Set email as verified
    await user.save();

    return user;
};

// Service to update user info
exports.updateUserInfo = async (userId, updates) => {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) throw new Error('User not found');
    return user;
};

// Service to modify email (with OTP verification)
exports.modifyEmail = async (userId, newEmail) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.email = newEmail;
    user.verifiedEmail = false;  // Reset email verification
    await user.save();

    return user;
};

// Service to update the user's location and track location history
exports.updateUserLocation = async ({ userId, lon, lat }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Store the current location in the location history
    const locationHistory = new LocationHistory({
        user: userId,
        location: {
            type: 'Point',
            coordinates: [lon, lat]
        }
    });
    await locationHistory.save();

    // Update the user's current location
    user.location = {
        type: 'Point',
        coordinates: [lon, lat]
    };

    await user.save();

    return user;
};

// Service to get the user's location history
exports.getUserLocationHistory = async (userId) => {
    const history = await LocationHistory.find({ user: userId }).sort({ updatedAt: -1 });
    return history;
};

// Service to upload and save the user's avatar
exports.uploadUserAvatar = async (userId, file) => {
    // Upload the file to Cloudinary
    const avatarUrl = await uploadService.uploadToCloudinary(file);

    // Update the user's avatar URL in the database
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.avatar = avatarUrl;
    await user.save();

    return user;
};

// Service to get multiple users with pagination, filters, and rankings
exports.getUsers = async ({ page = 1, limit = 10, filters = {}, sortBy = 'points', order = 'desc' }) => {
    const query = {};

    // Apply filters if provided
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };  // Case-insensitive search by name
    if (filters.email) query.email = { $regex: filters.email, $options: 'i' };  // Case-insensitive search by email

    // Sorting (e.g., by points)
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Paginated query
    const users = await User.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()  // Use lean() to get plain JS objects
        .exec();

    const total = await User.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        users
    };
};

// Service to get a user by ID
exports.getUserById = async (userId) => {
    const user = await User.findById(userId).lean();  // Use lean() to get plain JS object
    if (!user) throw new Error('User not found');
    return user;
};

// Service to get user by email
exports.getUserByEmail = async (email) => {
    const user = await User.findOne({ email }).lean();  // Retrieve the plain JS object with lean()
    if (!user) throw new Error('User not found');
    return user;
};

// Service to update user details
exports.updateUser = async (userId, updates) => {
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).lean();
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
};

// Service to delete a user by ID
exports.deleteUser = async (userId) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) throw new Error('User not found');
    return deletedUser;
};

module.exports = userService = { 
    getUserById, 
    updateUserById 
};
