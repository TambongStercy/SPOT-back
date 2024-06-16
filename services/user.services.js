// userService.js
const userModel = require('../models/userModel.js');

class userService {
    static async getUserById(userId) {
        return await userModel.findById(userId);
    }

    
    // Other user-related business logic...
}

module.exports = userService;
