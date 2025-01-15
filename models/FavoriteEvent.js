const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteEventSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true }
}, {
    timestamps: true
});

// Prevent duplicate entries for the same user and event
FavoriteEventSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteEvent', FavoriteEventSchema); 