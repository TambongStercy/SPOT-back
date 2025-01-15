const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocationHistorySchema = new Schema({
    userDevice: { 
        type: Schema.Types.ObjectId, 
        ref: 'UserDevice', 
        required: true 
    },
    location: {
        type: { type: String, default: 'Point' },  // GeoJSON point
        coordinates: { type: [Number], required: true }  // [longitude, latitude]
    }
}, {
    timestamps: true
});

// Create a geospatial index for the location
LocationHistorySchema.index({ location: '2dsphere' });

// Create an index for userDevice and updatedAt for efficient queries
LocationHistorySchema.index({ userDevice: 1, updatedAt: -1 });

module.exports = mongoose.model('LocationHistory', LocationHistorySchema);
