const Joi = require('joi');

// Validation schema for creating/updating an event
const validateEvent = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        description: Joi.string().min(10).required(),
        daysAndTimes: Joi.array()
            .items(
                Joi.object({
                    day: Joi.string().min(3).max(15).required(),
                    startTime: Joi.string().required(),
                    endTime: Joi.string().required(),
                })
            )
            .optional(),
        launchDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().greater(Joi.ref('launchDate')).required(),
        location: Joi.object({
            type: Joi.string().valid('Point').required(),
            coordinates: Joi.array().items(Joi.number()).length(2).required(),
        }).required(),
        locationDescription: Joi.string().optional(),
        images: Joi.array().items(Joi.string().uri()).optional(),
        ticketImage: Joi.string().uri().optional(),
        ticketPrice: Joi.number().min(0).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for buying tickets
const validateBuyTickets = (req, res, next) => {
    const schema = Joi.object({
        eventId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for active and ended events (query parameters)
const validateEventFilters = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        name: Joi.string().optional(),
        location: Joi.object({
            lon: Joi.number().required(),
            lat: Joi.number().required(),
        }).optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

module.exports = { validateEvent, validateBuyTickets, validateEventFilters };
