const mongoose = require('mongoose');
const { Schema } = mongoose;

const RatingSchema = new Schema({
    spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    review: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', RatingSchema);
