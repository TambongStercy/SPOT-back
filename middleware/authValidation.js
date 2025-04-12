const Joi = require('joi');
const { ValidationError } = require('../utils/errorHandler');

// Validation schema for user registration
exports.validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(), // International phone format
        email: Joi.string().email().optional(),
        password: Joi.string().min(6).required(),
        dateOfBirth: Joi.date().iso().required(),
        sex: Joi.string().valid('Male', 'Female', 'Other').required(),
        refferalCode: Joi.string().optional(),
        username: Joi.string().min(3).max(50).optional()
            .custom((value, helpers) => {
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
        fcmToken: Joi.string().required(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validation schema for user login
exports.validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
        password: Joi.string().required(),
        fcmToken: Joi.string().required(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional(),
    }).xor('email', 'phone'); // Require either email or phone, but not both

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validation schema for user login with phone
exports.validateLoginWithPhone = (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
        password: Joi.string().min(6).required(),
        fcmToken: Joi.string().required(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional(),
    }); 

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

exports.validateForgotPassword = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).optional(),
        newPassword: Joi.string().min(6).optional(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

exports.validateEmailVerification = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).optional(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional()
    });


    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

exports.validatePhoneVerification = (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
        otp: Joi.string().length(6).optional(),
        deviceInfo: Joi.string().required(),
        location: Joi.object().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validate change password request
exports.validateChangePassword = (req, res, next) => {
    const { oldPassword, newPassword, deviceInfo, location } = req.body;
    const errors = new ValidationError('Validation Error');

    if (!oldPassword) {
        errors.addError('oldPassword', 'Current password is required');
    }

    if (!newPassword) {
        errors.addError('newPassword', 'New password is required');
    } else if (newPassword.length < 6) {
        errors.addError('newPassword', 'New password must be at least 6 characters long');
    }

    if (!deviceInfo) {
        errors.addError('deviceInfo', 'Device info is required');
    }

    if (errors.validationErrors.length > 0) {
        throw errors;
    }

    next();
};
