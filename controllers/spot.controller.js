const spotService = require('../services/spot.services');  // Import the Spot service

// Create a Spot
const createSpot = async (req, res) => {
    try {
        const spotData = req.body;
        const newSpot = await spotService.createSpot(spotData);
        res.status(201).json(newSpot);
    } catch (error) {
        res.status(500).json({ message: 'Error creating spot', error });
    }
};

// Update a Spot
const updateSpot = async (req, res) => {
    try {
        const spotId = req.params.id;
        const updateFields = req.body;
        const updatedSpot = await spotService.updateSpotById(spotId, updateFields);
        if (!updatedSpot) {
            return res.status(404).json({ message: 'Spot not found' });
        }
        res.status(200).json(updatedSpot);
    } catch (error) {
        res.status(500).json({ message: 'Error updating spot', error });
    }
};

// Delete a Spot
const deleteSpot = async (req, res) => {
    try {
        const spotId = req.params.id;
        const deletedSpot = await spotService.deleteSpotById(spotId);
        if (!deletedSpot) {
            return res.status(404).json({ message: 'Spot not found' });
        }
        res.status(200).json(deletedSpot);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting spot', error });
    }
};

// Find Spots
const findSpots = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...query } = req.query;
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);

        const result = await spotService.findSpots(query, parsedPage, parsedLimit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error finding spots', error: error.message });
    }
};

module.exports = {
    createSpot,
    updateSpot,
    deleteSpot,
    findSpots,
};
