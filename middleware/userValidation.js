const Joi = require('joi');

// Validation schema for requesting an OTP
const validateRequestOtp = (req, res, next) => {
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
const validateResetPassword = (req, res, next) => {
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
const validateVerifyEmail = (req, res, next) => {
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
const validateModifyUserInfo = (req, res, next) => {
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
const validateModifyEmail = (req, res, next) => {
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
const validateUpdateLocation = (req, res, next) => {
    const schema = Joi.object({
        lon: Joi.number().required(),
        lat: Joi.number().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next();
};

// Validation schema for uploading an avatar
const validateUploadAvatar = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Avatar file is required' });
    }
    next();
};

// Validation schema for paginated user list with filters
const validateGetUsers = (req, res, next) => {
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

module.exports = {
    validateRequestOtp,
    validateResetPassword,
    validateVerifyEmail,
    validateModifyUserInfo,
    validateModifyEmail,
    validateUpdateLocation,
    validateUploadAvatar,
    validateGetUsers,
};
