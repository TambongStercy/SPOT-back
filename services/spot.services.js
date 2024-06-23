const spotModel = require('../models/spotModel.js');


// Create a Spot
const createSpot = async (spotData) => {
    try {
        const spot = new spotModel(spotData);
        const savedSpot = await spot.save();
        return savedSpot;
    } catch (error) {
        console.error('Error creating spot:', error);
        throw error;
    }
};

// Update a Spot
const updateSpotById = async (spotId, updateFields) => {
    try {
        const updatedSpot = await spotModel.findByIdAndUpdate(spotId, updateFields, { new: true }).exec();
        return updatedSpot;
    } catch (error) {
        console.error('Error updating spot:', error);
        throw error;
    }
};

// Delete a Spot
const deleteSpotById = async (spotId) => {
    try {
        const deletedSpot = await spotModel.findByIdAndDelete(spotId).exec();
        return deletedSpot;
    } catch (error) {
        console.error('Error deleting spot:', error);
        throw error;
    }
};

// Find Spots with Pagination
const findSpots = async (query, page, limit) => {
    try {
        const skip = (page - 1) * limit;
        const spots = await spotModel.find(query).skip(skip).limit(limit).exec();
        const totalSpots = await spotModel.countDocuments(query).exec();
        const pages = Math.ceil(totalSpots / limit);
        return {
            spots,
            page,
            pages
        };
    } catch (error) {
        console.error('Error finding spots:', error);
        throw error;
    }
};


module.exports = {
    createSpot,
    updateSpotById,
    deleteSpotById,
    findSpots,
};