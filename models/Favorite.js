const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true }
}, {
    timestamps: true
});

// Prevent duplicate entries for the same user and spot
FavoriteSchema.index({ user: 1, spot: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);
