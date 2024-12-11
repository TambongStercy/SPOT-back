const Joi = require('joi');

// Validation schema for creating/updating a spot
const validateSpot = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        town: Joi.string().min(3).max(50).required(),
        contacts: Joi.array().items(Joi.number()).min(1).required(),
        description: Joi.string().min(10).required(),
        type: Joi.string().valid('cafe', 'restaurant', 'hotel', 'bar', 'club', 'other').required(),
        location: Joi.object({
            type: Joi.string().valid('Point').required(),
            coordinates: Joi.array().items(Joi.number()).length(2).required(),
        }).required(),
        budget: Joi.number().min(0).required(),
        coverImage: Joi.string().uri().optional(),
        profileImage: Joi.string().uri().optional(),
        menuImages: Joi.array().items(Joi.string().uri()).optional(),
        openingTimes: Joi.object({
            monday: Joi.string().optional(),
            tuesday: Joi.string().optional(),
            wednesday: Joi.string().optional(),
            thursday: Joi.string().optional(),
            friday: Joi.string().optional(),
            saturday: Joi.string().optional(),
            sunday: Joi.string().optional(),
        }).optional(),
        locationDescription: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for filtering spots
const validateFilterSpots = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        name: Joi.string().optional(),
        town: Joi.string().optional(),
        contacts: Joi.string().optional(),
        type: Joi.string().valid('cafe', 'restaurant', 'hotel', 'bar', 'club', 'other').optional(),
        budget: Joi.number().min(0).optional(),
        lon: Joi.number().optional(),
        lat: Joi.number().optional(),
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for rating a spot
const validateRateSpot = (req, res, next) => {
    const schema = Joi.object({
        rating: Joi.number().integer().min(0).max(5).required(),
        review: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

module.exports = { validateSpot, validateFilterSpots, validateRateSpot };
