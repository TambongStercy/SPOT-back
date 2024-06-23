// userService.js
const userModel = require('../models/userModel.js');

const getUserById = async (userId) => {
    return await userModel.findById(userId);
}

const updateUserById = async (userId, updateFields) => {
    return await userModel.findByIdAndUpdate(userId, updateFields, { new: true }).exec();
}


module.exports = userService = { 
    getUserById, 
    updateUserById 
};
