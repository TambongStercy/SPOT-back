const mongoose = require('mongoose');
const { Schema } = mongoose;

const CurrentLocationSchema = new Schema({
    userDevice: { 
        type: Schema.Types.ObjectId, 
        ref: 'UserDevice', 
        required: true,
        unique: true  // This ensures one location per device
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]  // [longitude, latitude]
    }
}, {
    timestamps: true
});

// Create geospatial index for location
CurrentLocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CurrentLocation', CurrentLocationSchema); 