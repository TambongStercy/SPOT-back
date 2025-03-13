// userService.js
const User = require('../models/User');
const LocationHistory = require('../models/LocationHistory');
const CurrentLocation = require('../models/SessionLocation');
const uploadService = require('./upload.services');
const bcrypt = require('bcryptjs');
const UserDevice = require('../models/UserDevice');

// Service to reset password after OTP verification
exports.resetPassword = async (userId, newPassword) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return user;
};

// Service to update user info
exports.updateUserInfo = async (userId, updates) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if email is being updated
    if (updates.email && updates.email !== user.email) {
        // Check if new email already exists
        const emailExists = await User.findOne({ email: updates.email });
        if (emailExists) {
            throw new Error('Email already registered');
        }
        updates.verifiedEmail = false; // Reset email verification
    }

    // Check if username is being updated
    if (updates.username && updates.username !== user.username) {
        // Ensure username starts with '@'
        if (!updates.username.startsWith('@')) {
            updates.username = '@' + updates.username;
        }

        // Check if new username already exists
        const usernameExists = await User.findOne({ username: updates.username });
        if (usernameExists) {
            throw new Error('Username already taken');
        }
    }

    // Check if phone is being updated
    if (updates.phone && updates.phone !== user.phone) {
        // Check if new phone already exists
        const phoneExists = await User.findOne({ phone: updates.phone });
        if (phoneExists) {
            throw new Error('Phone number already registered');
        }
        updates.phoneVerified = false; // Reset phone verification
    }

    // Update user and return updated document
    return await User.findByIdAndUpdate(userId, updates, { new: true });
};

// Service to modify email (with OTP verification)
exports.modifyEmail = async (userId, newEmail) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if new email already exists
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
        throw new Error('Email already registered');
    }

    user.email = newEmail;
    user.verifiedEmail = false;  // Reset email verification
    await user.save();

    return user;
};

// Modify phone specifically
exports.modifyPhone = async (userId, newPhone) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if new phone already exists
    const phoneExists = await User.findOne({ phone: newPhone });
    if (phoneExists) {
        throw new Error('Phone number already registered');
    }

    user.phone = newPhone;
    user.verifiedPhone = false; // Reset phone verification status
    await user.save();

    return user;
};

// Service to update only the current location without history
exports.updateUserCurrentLocation = async ({ userId, fcmToken, lon, lat }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Find the user device
    const userDevice = await UserDevice.findOne({ fcmToken });
    if (!userDevice) {
        throw new Error('Device not found. Please register your device first.');
    }

    // Check if device belongs to the user
    if (userDevice.user.toString() !== userId) {
        throw new Error('This device is not registered to your account');
    }

    // Create location object
    const locationData = {
        type: 'Point',
        coordinates: [lon, lat]
    };

    // Update or create current location
    const currentLocation = await CurrentLocation.findOneAndUpdate(
        { userDevice: userDevice._id },
        { location: locationData },
        { upsert: true, new: true }
    );

    // Update the user's current location
    user.location = locationData;
    await user.save();

    return { user, currentLocation };
};

// Service to update the user's location and track location history
exports.updateUserLocation = async ({ userId, fcmToken, lon, lat }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Find the user device
    const userDevice = await UserDevice.findOne({ fcmToken });
    if (!userDevice) {
        throw new Error('Device not found. Please register your device first.');
    }

    // Check if device belongs to the user
    if (userDevice.user.toString() !== userId) {
        throw new Error('This device is not registered to your account');
    }

    // Create location object
    const locationData = {
        type: 'Point',
        coordinates: [lon, lat]
    };

    // Store the current location in the location history
    const locationHistory = new LocationHistory({
        userDevice: userDevice._id,
        location: locationData
    });
    await locationHistory.save();

    // Update or create current location
    await CurrentLocation.findOneAndUpdate(
        { userDevice: userDevice._id },
        { location: locationData },
        { upsert: true, new: true }
    );

    // Update the user's current location
    user.location = locationData;
    await user.save();

    return { user, locationHistory };
};

// Service to get the user's location history across all devices
exports.getUserLocationHistory = async (userId, options = {}) => {
    const {
        startDate,
        endDate,
        limit = 100,
        fcmToken = null
    } = options;

    // Start building the query
    const query = {};

    if (fcmToken) {
        // If fcmToken is provided, get history for specific device
        const device = await UserDevice.findOne({ fcmToken: fcmToken, user: userId });
        console.log(device);

        if (!device) {
            throw new Error('Device not found for this user');
        }
        query.userDevice = device._id;
    } else {
        // Otherwise, get history for all user's devices
        const userDevices = await UserDevice.find({ user: userId });
        query.userDevice = { $in: userDevices.map(device => device._id) };
    }

    // Add date range if provided
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }


    const history = await LocationHistory.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userDevice', '_id deviceInfo fcmToken');

    return history;
};

// Service to get the latest location for each of user's devices
exports.getUserDevicesLatestLocations = async (userId) => {
    const userDevices = await UserDevice.find({ user: userId });


    const latestLocations = await Promise.all(
        userDevices.map(async device => {
            const latest = await LocationHistory.findOne({ userDevice: device._id })
                .sort({ createdAt: -1 })
                .populate('userDevice', '_id deviceInfo fcmToken');
            return {
                device: {
                    _id: device._id,
                    deviceInfo: device.deviceInfo,
                    fcmToken: device.fcmToken
                },
                location: latest
            };
        })
    );

    return latestLocations;
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

exports.getUserByPhone = async (phone) => {
    const user = await User.findOne({ phone }).lean();
    if (!user) throw new Error('User not found');
    return user;
}

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

// Service to logout a specific device
exports.logoutDevice = async (userId, fcmToken) => {
    // Find the user device
    const userDevice = await UserDevice.findOne({ fcmToken });
    if (!userDevice) {
        throw new Error('Device not found. Please register your device first.');
    }

    // Check if device belongs to the user
    if (userDevice.user.toString() !== userId) {
        throw new Error('This device is not registered to your account');
    }

    // Deactivate the device
    userDevice.isActive = false;
    await userDevice.save();

    return true;
};

// handleUserVerification and validateReferralCode have been removed
// They are now in their respective service files

