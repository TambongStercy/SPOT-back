const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Service for registering a user
exports.register = async ({ name, email, password, dateOfBirth, sex, avatar, fcmtoken }) => {
    let user = await User.findOne({ email });
    if (user) throw new Error('User already exists');

    // Create a new user
    user = new User({ name, email, password, dateOfBirth, sex, avatar, fcmtoken });
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    user.token = token;  // Save the JWT token in the user model
    await user.save();

    return { token, user };
};

// Service for logging in a user
exports.login = async ({ email, password, fcmtoken }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Update the user's FCM token and JWT token
    user.fcmtoken = fcmtoken;
    user.token = token;
    await user.save();

    return { token, user };
};

// Service for logging out a user (remove FCM token)
exports.logout = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Remove the JWT token and FCM token
    user.token = null;
    user.fcmtoken = null;
    await user.save();

    return true;
};
