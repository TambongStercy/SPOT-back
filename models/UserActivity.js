const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserActivitySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: Schema.Types.ObjectId, required: true }, // Refers to Spot or Event
    itemType: { type: String, enum: ['Spot', 'Event'], required: true },
    action: {
        type: String,
        enum: ['view', 'like', 'dislike', 'book', 'search', 'share', 'favorite', 'open'],
        required: true
    },
    metadata: { type: Object }, // Additional data (e.g., time spent, search query)
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserActivity', UserActivitySchema);
