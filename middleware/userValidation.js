const Joi = require('joi');

// Validation schema for requesting an OTP
exports.validateRequestOtp = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        reason: Joi.string()
            .valid('modify-email', 'update-info', 'reset-password', 'verify-email')
            .required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for resetting a password
exports.validateResetPassword = (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.string().length(6).required(),
        newPassword: Joi.string().min(8).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for verifying an email
exports.validateVerifyEmail = (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.string().length(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for modifying user info
exports.validateModifyUserInfo = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).optional(),
        avatar: Joi.string().uri().optional(),
        dateOfBirth: Joi.date().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for modifying email
exports.validateModifyEmail = (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.string().length(6).required(),
        newEmail: Joi.string().email().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for updating user location
exports.validateUpdateLocation = (req, res, next) => {
    const schema = Joi.object({
        lon: Joi.number().required(),
        lat: Joi.number().required(),
        fcmToken: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for uploading an avatar
exports.validateUploadAvatar = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Avatar file is required' });
    }
    next();
};

// Validation schema for paginated user list with filters
exports.validateGetUsers = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        name: Joi.string().optional(),
        email: Joi.string().optional(),
        sortBy: Joi.string().valid('points', 'name', 'email').optional(),
        order: Joi.string().valid('asc', 'desc').optional(),
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validate favorite spot operations
exports.validateFavoriteSpotOperation = (req, res, next) => {
    const schema = Joi.object({
        spotId: Joi.string().required().messages({
            'string.empty': 'Spot ID is required',
            'any.required': 'Spot ID is required'
        }),
        userId: Joi.string().optional().messages({
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
    });

    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validate favorite event operations
exports.validateFavoriteEventOperation = (req, res, next) => {
    const schema = Joi.object({
        eventId: Joi.string().required().messages({
            'string.empty': 'Event ID is required',
            'any.required': 'Event ID is required'
        }),
        userId: Joi.string().optional().messages({
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
    });

    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validate get favorites query parameters
exports.validateGetFavorites = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};


