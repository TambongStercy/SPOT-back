const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReservationSchema = new Schema({
    spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    groupSize: { type: Number, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', ReservationSchema);
