const reservationService = require('../services/reservation.services');

exports.createReservation = async (req, res) => {
    try {
        const newReservation = await reservationService.createReservation({
            spotId: req.body.spotId,
            userId: req.user.id,  // Assuming you have user info from JWT
            date: req.body.date,
            time: req.body.time,
            groupSize: req.body.groupSize
        });
        res.json(newReservation);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};
