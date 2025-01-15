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
        sex: Joi.string().valid('Male', 'Female').required(),
        fcmToken: Joi.string().required(),
        deviceInfo: Joi.string().required()
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
        deviceInfo: Joi.string().required()
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
        deviceInfo: Joi.string().required()
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
        newPassword: Joi.string().min(6).optional()
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
        otp: Joi.string().length(6).optional()
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
        otp: Joi.string().length(6).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

// Validate change password request
exports.validateChangePassword = (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const errors = new ValidationError('Validation Error');

    if (!oldPassword) {
        errors.addError('oldPassword', 'Current password is required');
    }

    if (!newPassword) {
        errors.addError('newPassword', 'New password is required');
    } else if (newPassword.length < 6) {
        errors.addError('newPassword', 'New password must be at least 6 characters long');
    }

    if (errors.validationErrors.length > 0) {
        throw errors;
    }

    next();
};
