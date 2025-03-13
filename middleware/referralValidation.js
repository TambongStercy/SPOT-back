const Joi = require('joi');

/**
 * Validate get user referrals request
 */
exports.validateGetUserReferrals = (req, res, next) => {
    const schema = Joi.object({
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