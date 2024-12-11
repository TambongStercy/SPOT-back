const Joi = require('joi');

// Validation schema for creating a reservation
const validateCreateReservation = (req, res, next) => {
    const schema = Joi.object({
        spotId: Joi.string().required(), // Spot ID is required
        date: Joi.date().iso().required(), // Reservation date in ISO format
        time: Joi.string().required(), // Time of reservation
        groupSize: Joi.number().integer().min(1).required(), // Group size must be at least 1
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }

    next(); // Proceed to the next middleware or route handler
};

module.exports = { validateCreateReservation };
