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
        username: Joi.string().min(3).max(50).optional()
            .custom((value, helpers) => {
                // If username is provided, validate it
                if (value) {
                    // Remove '@' if it exists to check the actual username length
                    const usernameWithoutAt = value.startsWith('@') ? value.substring(1) : value;

                    // Check if username (without @) is too short
                    if (usernameWithoutAt.length < 2) {
                        return helpers.error('string.usernameMinLength');
                    }

                    // Check if username contains only valid characters
                    if (!/^[a-zA-Z0-9_]+$/.test(usernameWithoutAt)) {
                        return helpers.error('string.usernameInvalid');
                    }
                }
                return value;
            })
            .messages({
                'string.usernameMinLength': 'Username must be at least 3 characters long (including @)',
                'string.usernameInvalid': 'Username can only contain letters, numbers, and underscores'
            }),
        refferalCode: Joi.string().optional(),
        sex: Joi.string().valid('Male', 'Female', 'Other').optional(),
        dateOfBirth: Joi.date().optional(),
        deviceInfo: Joi.string().optional(),
        location: Joi.object().optional()
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

// Validate getting user devices latest locations
exports.validateGetUserDevicesLatestLocations = (req, res, next) => {
    // No specific validation needed as it uses the authenticated user's ID
    next();
};

// Validate logout device operation
exports.validateLogoutDevice = (req, res, next) => {
    const schema = Joi.object({
        fcmToken: Joi.string().required().messages({
            'string.empty': 'FCM Token is required',
            'any.required': 'FCM Token is required'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validation schema for getting recently opened items
exports.validateGetRecentlyOpenedItems = (req, res, next) => {
    const schema = Joi.object({
        itemType: Joi.string().valid('Spot', 'Event'),
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100)
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    next();
};


