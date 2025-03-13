const mongoose = require('mongoose');
const { Schema } = mongoose;

const RatingSchema = new Schema({
    spot: { type: Schema.Types.ObjectId, ref: 'Spot' },
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    review: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});

// Validation to ensure either spot or event is provided but not both
RatingSchema.pre('validate', function (next) {
    if ((this.spot && this.event) || (!this.spot && !this.event)) {
        next(new Error('Rating must reference either a spot or an event, but not both'));
    } else {
        next();
    }
});

// Compound index to prevent duplicate ratings from the same user
RatingSchema.index({ user: 1, spot: 1 }, { unique: true, sparse: true });
RatingSchema.index({ user: 1, event: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Rating', RatingSchema);
