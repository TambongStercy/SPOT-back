const Joi = require('joi');

/**
 * Validate get user transactions request
 */
exports.validateGetUserTransactions = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        transType: Joi.string().valid('deposit', 'payout')
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

/**
 * Validate award random spot points request
 */
exports.validateAwardRandomSpotPoints = (req, res, next) => {
    const schema = Joi.object({
        spotId: Joi.string().required().messages({
            'string.empty': 'Spot ID is required',
            'any.required': 'Spot ID is required'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    next();
}; 