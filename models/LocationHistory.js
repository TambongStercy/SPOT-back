const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocationHistorySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
        type: { type: String, default: 'Point' },  // GeoJSON point
        coordinates: { type: [Number], required: true }  // [longitude, latitude]
    },
    updatedAt: { type: Date, default: Date.now }
});

// Create a geospatial index for the location
LocationHistorySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LocationHistory', LocationHistorySchema);
