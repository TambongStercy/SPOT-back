const Joi = require('joi');

// Validation schema for user registration
const validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        dateOfBirth: Joi.date().iso().required(),
        sex: Joi.string().valid('Male', 'Female').required(),
        avatar: Joi.string().uri().optional(), // Avatar can be optional
        fcmtoken: Joi.string().optional(), // Optional field
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

// Validation schema for user login
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        fcmtoken: Joi.string().optional(), // Optional field
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

module.exports = { validateRegister, validateLogin };
