const authService = require('../services/auth.services');

// Controller to register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, dateOfBirth, sex, avatar, fcmtoken } = req.body;
        const { token, user } = await authService.register({ name, email, password, dateOfBirth, sex, avatar, fcmtoken });
        res.json({ token, user });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to login a user
exports.login = async (req, res) => {
    try {
        const { email, password, fcmtoken } = req.body;
        const { token, user } = await authService.login({ email, password, fcmtoken });
        res.json({ token, user });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
};

// Controller to logout a user
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;
        await authService.logout(userId);
        res.json({ msg: 'User logged out successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};