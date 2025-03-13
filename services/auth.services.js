const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserDevice = require('../models/UserDevice');
const pointTransactionService = require('./pointTransaction.service');
const referralService = require('./referral.service');

// Generate access token
const generateAccessToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived token
    );
};

// Service for registering a user
exports.register = async ({ name, phone, email, password, dateOfBirth, sex, avatar, fcmToken, deviceInfo, username, refferalCode }) => {
    // Check if user exists with phone
    let user = await User.findOne({ phone });
    if (user) throw new Error('Phone number already registered');

    // If email is provided, check if it exists
    if (email) {
        user = await User.findOne({ email });
        if (user) throw new Error('Email already registered');
    }

    // Generate username if not provided
    if (!username) {
        // Create a base username from the name (remove spaces, lowercase)
        const baseUsername = name.toLowerCase().replace(/\s+/g, '');

        // Try to find a unique username
        let uniqueUsername = baseUsername;
        let counter = 1;
        let usernameExists = await User.findOne({ username: '@' + uniqueUsername });

        // If username exists, add a number and try again
        while (usernameExists) {
            uniqueUsername = baseUsername + counter;
            counter++;
            usernameExists = await User.findOne({ username: '@' + uniqueUsername });
        }

        username = '@' + uniqueUsername;
    } else if (!username.startsWith('@')) {
        // Ensure username starts with '@'
        username = '@' + username;
    }

    // Check if referral code is provided
    let referrerUser = null;
    if (refferalCode) {
        // Find user with this referral code
        referrerUser = await User.findOne({ refferalCode });
        if (!referrerUser) throw new Error('Invalid referral code');
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) throw new Error('Username already taken');

    // Create a new user
    user = new User({
        name,
        phone,
        email,
        password,
        dateOfBirth,
        sex,
        avatar,
        username,
        phoneVerified: false
    });

    // Generate a unique referral code
    let isReferralCodeUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isReferralCodeUnique && attempts < maxAttempts) {
        // Generate a referral code
        const generatedCode = user.generateReferralCode();

        // Check if this code already exists
        const existingCode = await User.findOne({ refferalCode: generatedCode });

        if (!existingCode) {
            user.refferalCode = generatedCode;
            isReferralCodeUnique = true;
        } else {
            attempts++;
        }
    }

    // If we couldn't generate a unique code after max attempts, create a truly random one
    if (!isReferralCodeUnique) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase() +
            Math.floor(1000 + Math.random() * 9000);
        user.refferalCode = randomCode;
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    // Create a new device for the user
    const userDevice = new UserDevice({
        user: user._id,
        fcmToken,
        deviceInfo
    });
    await userDevice.save();

    // Create referral record and award points if applicable
    if (referrerUser) {
        try {
            await referralService.createReferral({
                referrerId: referrerUser._id,
                referredId: user._id,
                referralCode: refferalCode
            });
        } catch (error) {
            console.error('Error creating referral record:', error);
            // Don't throw error, continue with registration

            // Still try to award points if referral record creation fails
            try {
                await pointTransactionService.awardReferralPoints(referrerUser._id, user._id);
            } catch (pointsError) {
                console.error('Error awarding referral points:', pointsError);
            }
        }
    }

    // Generate access token
    const accessToken = generateAccessToken(user.id);

    return { accessToken, user, userDevice };
};

// Service for logging in a user with email or phone
exports.login = async ({ email, phone, password, fcmToken, deviceInfo }) => {
    let user;

    // Find user by email or phone
    if (email) {
        user = await User.findOne({ email });
    } else if (phone) {
        user = await User.findOne({ phone });
    }

    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Generate access token
    const accessToken = generateAccessToken(user.id);

    let userDevice;

    // Update or create device record
    if (fcmToken && deviceInfo) {
        userDevice = await UserDevice.findOneAndUpdate(
            { user: user.id, fcmToken },
            {
                deviceInfo,
                lastUsed: new Date(),
                isActive: true
            },
            { upsert: true }
        );
    }

    return { accessToken, user, userDevice };
};

// Service to refresh access token using FCM token
exports.refreshToken = async (fcmToken) => {
    const device = await UserDevice.findOne({ fcmToken, isActive: true });
    if (!device) {
        throw new Error('Invalid refresh token');
    }

    // Update last used timestamp
    device.lastUsed = new Date();
    await device.save();

    // Generate new access token
    const accessToken = generateAccessToken(device.user);

    return { accessToken };
};

// Service for logging out a user
exports.logout = async (userId, fcmToken) => {
    if (fcmToken) {
        // Deactivate the device
        return await UserDevice.findOneAndUpdate(
            { user: userId, fcmToken },
            { isActive: false }
        );
    }
};

// Service to logout from all devices(Returns the device the initiated the logout if fcmToken is provided)
exports.logoutAll = async (userId, fcmToken) => {
    await UserDevice.updateMany(
        { user: userId },
        { isActive: false }
    );
    if (fcmToken) {
        return await UserDevice.findOne(
            { user: userId, fcmToken },
        );
    }
};

// Change password service
exports.changePassword = async ({ userId, oldPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and logout from all devices
    user.password = hashedPassword;
    await user.save();

    // Logout from all devices for security
    await this.logoutAll(userId);

    return true;
};

// Service to get user's active devices
exports.getUserDevices = async (userId) => {
    return await UserDevice.find({ user: userId, isActive: true })
        .select('-__v')
        .sort('-lastUsed');
};

/**
 * Handle user verification (email or phone)
 * @param {String} userId - User ID
 * @param {String} verificationType - Type of verification ('email' or 'phone')
 * @returns {Promise<Object>} - Updated user and referral processing results
 */
exports.handleUserVerification = async (userId, verificationType) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Update verification status
    if (verificationType === 'email') {
        user.verifiedEmail = true;
    } else if (verificationType === 'phone') {
        user.phoneVerified = true;
    } else {
        throw new Error('Invalid verification type');
    }

    await user.save();

    // Process any pending referrals
    const referralResults = await referralService.processPendingReferrals(userId);

    return {
        user,
        referralResults
    };
};
