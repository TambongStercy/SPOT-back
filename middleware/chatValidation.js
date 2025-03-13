const Joi = require('joi');

/**
 * Validate create chat request
 */
exports.validateCreateChat = (req, res, next) => {
    const schema = Joi.object({
        subject: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'Subject is required',
            'string.min': 'Subject must be at least 3 characters long',
            'string.max': 'Subject cannot exceed 100 characters',
            'any.required': 'Subject is required'
        }),
        message: Joi.string().min(1).max(2000).required().messages({
            'string.empty': 'Message is required',
            'string.min': 'Message cannot be empty',
            'string.max': 'Message cannot exceed 2000 characters',
            'any.required': 'Message is required'
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

/**
 * Validate add message request
 */
exports.validateAddMessage = (req, res, next) => {
    const schema = Joi.object({
        chatId: Joi.string().required().messages({
            'string.empty': 'Chat ID is required',
            'any.required': 'Chat ID is required'
        }),
        content: Joi.string().min(1).max(2000).required().messages({
            'string.empty': 'Message content is required',
            'string.min': 'Message content cannot be empty',
            'string.max': 'Message content cannot exceed 2000 characters',
            'any.required': 'Message content is required'
        }),
        attachments: Joi.array().items(Joi.string().uri()).optional()
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

/**
 * Validate get chats request
 */
exports.validateGetChats = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        status: Joi.string().valid('open', 'closed', 'pending')
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
 * Validate update chat status request
 */
exports.validateUpdateChatStatus = (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string().valid('open', 'closed', 'pending').required().messages({
            'string.empty': 'Status is required',
            'any.required': 'Status is required',
            'any.only': 'Status must be one of: open, closed, pending'
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