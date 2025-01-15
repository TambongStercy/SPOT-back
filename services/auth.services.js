const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserDevice = require('../models/UserDevice');

// Generate access token
const generateAccessToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived token
    );
};

// Service for registering a user
exports.register = async ({ name, phone, email, password, dateOfBirth, sex, avatar, fcmToken, deviceInfo }) => {
    // Check if user exists with phone
    let user = await User.findOne({ phone });
    if (user) throw new Error('Phone number already registered');

    // If email is provided, check if it exists
    if (email) {
        user = await User.findOne({ email });
        if (user) throw new Error('Email already registered');
    }

    // Create a new user
    user = new User({ 
        name, 
        phone, 
        email, 
        password, 
        dateOfBirth, 
        sex, 
        avatar,
        phoneVerified: false
    });
    
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    // Generate access token
    const accessToken = generateAccessToken(user.id);

    // Store device information and FCM token
    if (fcmToken && deviceInfo) {
        await UserDevice.create({
            user: user.id,
            fcmToken,
            deviceInfo,
            isActive: true
        });
        console.log('successfully created a userDevice')
    }

    return { accessToken, user };
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

    // Update or create device record
    if (fcmToken && deviceInfo) {
        await UserDevice.findOneAndUpdate(
            { user: user.id, fcmToken },
            { 
                deviceInfo,
                lastUsed: new Date(),
                isActive: true
            },
            { upsert: true }
        );
    }

    return { accessToken, user };
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

// Service to verify phone number
exports.verifyPhone = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.phoneVerified = true;
    await user.save();

    return user;
};

// Service for logging out a user
exports.logout = async (userId, fcmToken) => {
    if (fcmToken) {
        // Deactivate the device
        await UserDevice.findOneAndUpdate(
            { user: userId, fcmToken },
            { isActive: false }
        );
    }
    return true;
};

// Service to logout from all devices
exports.logoutAll = async (userId) => {
    await UserDevice.updateMany(
        { user: userId },
        { isActive: false }
    );
    return true;
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
