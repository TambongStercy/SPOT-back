const Reservation = require('../models/Reservation');

exports.createReservation = async ({ spotId, userId, date, time, groupSize }) => {
    const newReservation = new Reservation({ spot: spotId, user: userId, date, time, groupSize });
    await newReservation.save();
    return newReservation;
};

exports.getUserReservations = async (userId) => {
    const reservations = await Reservation.find({ user: userId });
    return reservations;
};
