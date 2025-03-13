const Joi = require('joi');

// Validation schema for creating/updating a spot
const validateSpot = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        town: Joi.string().min(3).max(50).required(),
        contacts: Joi.array().items(Joi.string()).min(1).required(),
        description: Joi.string().min(10).required(),
        type: Joi.string().valid('restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach', 'other').required(),
        categories: Joi.array().items(
            Joi.string().valid(
                'Restaurant', 'Bar', 'Club', 'Lounge', 'Cafe',
                'Fast Food', 'Fine Dining', 'Pub', 'Sports Bar',
                'Rooftop', 'Beach Club', 'Shisha Lounge',
                'Live Music Venue', 'Karaoke Bar', 'Wine Bar',
                'Cocktail Bar', 'Other'
            )
        ).min(1).required(),
        cuisine: Joi.array().items(
            Joi.string().valid(
                'Nigerian', 'Italian', 'Chinese', 'Japanese', 'Indian',
                'American', 'Mexican', 'Thai', 'Mediterranean', 'French',
                'Spanish', 'Greek', 'Lebanese', 'Turkish', 'Korean',
                'Vietnamese', 'Brazilian', 'Caribbean', 'African',
                'Fusion', 'International', 'Seafood', 'Vegetarian',
                'Vegan', 'BBQ', 'Steakhouse', 'Other'
            )
        ).optional(),
        location: Joi.object({
            type: Joi.string().valid('Point').required(),
            coordinates: Joi.array().items(Joi.number()).length(2).required(),
        }).required(),
        budget: Joi.object({
            min: Joi.number().min(0).required(),
            max: Joi.number().min(Joi.ref('min')).required()
        }).required(),
        coverImage: Joi.string().uri().required(),
        profileImage: Joi.string().uri().required(),
        menuImages: Joi.array().items(Joi.string().uri()).optional(),
        images: Joi.array().items(Joi.string().uri()).optional(),
        daysAndTimes: Joi.array().items(
            Joi.object({
                day: Joi.string().valid(
                    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                    'Friday', 'Saturday', 'Sunday'
                ).required(),
                startTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required()
                    .messages({
                        'string.pattern.base': 'Start time must be in 24-hour format (HH:MM), e.g., "09:00" or "23:30"'
                    }),
                endTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required()
                    .messages({
                        'string.pattern.base': 'End time must be in 24-hour format (HH:MM), e.g., "09:00" or "23:30"'
                    })
            })
        ).required(),
        locationDescription: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for filtering spots
const validateFilterSpots = (req, res, next) => {
    // Define coordinate point schema
    const coordinatePoint = Joi.object({
        lng: Joi.number().min(-180).max(180).required(),
        lat: Joi.number().min(-90).max(90).required()
    });

    // Define bounds schema
    const boundsSchema = Joi.object({
        sw: coordinatePoint.required(),
        ne: coordinatePoint.required()
    });

    const schema = Joi.object({
        search: Joi.string().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        name: Joi.string().optional(),
        town: Joi.string().optional(),
        contacts: Joi.string().optional(),
        type: Joi.string().valid('restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach', 'other').lowercase().optional(),
        budget: Joi.number().min(0).optional(),
        minBudget: Joi.number().min(0).optional(),
        maxBudget: Joi.when('minBudget', {
            is: Joi.exist(),
            then: Joi.number().greater(Joi.ref('minBudget')),
            otherwise: Joi.number().min(0)
        }).optional(),
        cuisine: Joi.alternatives().try(
            Joi.string().valid(
                'Nigerian', 'Italian', 'Chinese', 'Japanese', 'Indian',
                'American', 'Mexican', 'Thai', 'Mediterranean', 'French',
                'Spanish', 'Greek', 'Lebanese', 'Turkish', 'Korean',
                'Vietnamese', 'Brazilian', 'Caribbean', 'African',
                'Fusion', 'International', 'Seafood', 'Vegetarian',
                'Vegan', 'BBQ', 'Steakhouse', 'Other'
            ),
            Joi.array().items(Joi.string())
        ).optional(),
        // Map bounds filtering
        bounds: Joi.string().optional(), // Changed from boundsSchema to string
        excludeBounds: Joi.string().optional(), // Changed from boundsSchema to string
        // Legacy location filtering (fallback)
        lon: Joi.number().min(-180).max(180).optional(),
        lat: Joi.number().min(-90).max(90).optional(),
        radius: Joi.number().positive().optional(),
        day: Joi.string().valid(
            'Monday', 'Tuesday', 'Wednesday', 'Thursday',
            'Friday', 'Saturday', 'Sunday'
        ).optional(),
        time: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional()
            .messages({
                'string.pattern.base': 'Time must be in 24-hour format (HH:MM), e.g., "09:00" or "23:30"'
            }),
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        sortBy: Joi.string().valid('rating', 'createdAt', 'budget.min', 'budget.max').optional(),
        sortOrder: Joi.string().valid('asc', 'desc').optional(),
        rating: Joi.number().min(0).max(5).optional()
    }).custom((value, helpers) => {
        // // Custom validation to ensure that if bounds is provided, lat/lon are not
        // if (value.bounds && (value.lat || value.lon)) {
        //     return helpers.error('object.xor', {
        //         message: 'Cannot use both bounds and lat/lon filtering simultaneously'
        //     });
        // }
        // If using lat/lon, both must be provided
        if ((value.lat && !value.lon) || (!value.lat && value.lon)) {
            return helpers.error('object.and', {
                message: 'Both latitude and longitude must be provided together'
            });
        }
        return value;
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
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

    next();
};

// Validation schema for recommended spots
const validateRecommendedSpots = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        type: Joi.string().valid('restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach', 'other').lowercase().optional(),
        town: Joi.string().optional(),
        search: Joi.string().optional(),
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        cuisine: Joi.alternatives().try(
            Joi.string().valid(
                'Nigerian', 'Italian', 'Chinese', 'Japanese', 'Indian',
                'American', 'Mexican', 'Thai', 'Mediterranean', 'French',
                'Spanish', 'Greek', 'Lebanese', 'Turkish', 'Korean',
                'Vietnamese', 'Brazilian', 'Caribbean', 'African',
                'Fusion', 'International', 'Seafood', 'Vegetarian',
                'Vegan', 'BBQ', 'Steakhouse', 'Other'
            ),
            Joi.array().items(Joi.string())
        ).optional(),
        budget: Joi.number().min(0).optional(),
        minBudget: Joi.number().min(0).optional(),
        maxBudget: Joi.when('minBudget', {
            is: Joi.exist(),
            then: Joi.number().greater(Joi.ref('minBudget')),
            otherwise: Joi.number().min(0)
        }).optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for trending spots
const validateTrendingSpots = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(10),
        days: Joi.number().integer().min(1).max(90).default(30),
        minActivityScore: Joi.number().min(0).optional(),
        type: Joi.string().valid('restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach', 'other').lowercase().optional(),
        town: Joi.string().optional(),
        search: Joi.string().optional(), 
        categories: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
        cuisine: Joi.alternatives().try(
            Joi.string().valid(
                'Nigerian', 'Italian', 'Chinese', 'Japanese', 'Indian',
                'American', 'Mexican', 'Thai', 'Mediterranean', 'French',
                'Spanish', 'Greek', 'Lebanese', 'Turkish', 'Korean',
                'Vietnamese', 'Brazilian', 'Caribbean', 'African',
                'Fusion', 'International', 'Seafood', 'Vegetarian',
                'Vegan', 'BBQ', 'Steakhouse', 'Other'
            ),
            Joi.array().items(Joi.string())
        ).optional(),
        budget: Joi.number().min(0).optional(),
        minBudget: Joi.number().min(0).optional(),
        maxBudget: Joi.when('minBudget', {
            is: Joi.exist(),
            then: Joi.number().greater(Joi.ref('minBudget')),
            otherwise: Joi.number().min(0)
        }).optional()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

module.exports = {
    validateSpot,
    validateFilterSpots,
    validateRateSpot,
    validateRecommendedSpots,
    validateTrendingSpots
};
