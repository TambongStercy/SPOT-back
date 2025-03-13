const Joi = require('joi');

// Validation schema for creating/updating an event
const validateEvent = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        description: Joi.string().min(10).required(),
        venue: Joi.string().min(3).max(100).required(),
        type: Joi.string().required(),
        profileImage: Joi.string().uri().optional(),
        contactInfo: Joi.object({
            phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).optional(),
            email: Joi.string().email().optional(),
            website: Joi.string().uri().optional()
        }).optional(),
        categories: Joi.array().items(
            Joi.string().valid(
                'Music',
                'Sports',
                'Arts',
                'Food',
                'Business',
                'Education',
                'Technology',
                'Entertainment',
                'Lifestyle',
                'Community',
                'Charity',
                'Other'
            )
        ).min(1).required(),
        daysAndTimes: Joi.array()
            .items(
                Joi.object({
                    day: Joi.string().valid(
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday'
                    ).required(),
                    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
                    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
                })
            )
            .min(1)
            .required(),
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

    next();
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

    next();
};

// Validation schema for event filters
const validateEventFilters = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        name: Joi.string().optional(),
        venue: Joi.string().optional(),
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
        location: Joi.alternatives().try(
            Joi.string(),  // For JSON string input
            Joi.array().items(Joi.number()).length(2)  // For direct array input
        ).optional(),
        radius: Joi.number().min(0).optional(),  // in meters
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for recommended events
const validateRecommendedEvents = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        name: Joi.string().optional(),
        venue: Joi.string().optional(),
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for trending events
const validateTrendingEvents = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        days: Joi.number().integer().min(1).max(90).default(30),
        minActivityScore: Joi.number().min(0).optional(),
        name: Joi.string().optional(),
        venue: Joi.string().optional(),
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

module.exports = {
    validateEvent,
    validateBuyTickets,
    validateEventFilters,
    validateRecommendedEvents,
    validateTrendingEvents
};
