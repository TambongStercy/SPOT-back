const Joi = require('joi');

// Validation schema for generating an OTP
const validateGenerateOtp = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required(), // Assuming user ID is required for OTP generation
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for verifying an OTP
const validateVerifyOtp = (req, res, next) => {
    const schema = Joi.object({
        otp: Joi.string().length(6).required(), // OTP is typically a 6-digit code
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for deleting an OTP
const validateDeleteOtp = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.string().required(), // Assuming user ID is required for OTP deletion
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

module.exports = { validateGenerateOtp, validateVerifyOtp, validateDeleteOtp };
