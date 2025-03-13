const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionLocationSchema = new Schema({
    userDevice: {
        type: Schema.Types.ObjectId,
        ref: 'UserDevice'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        required: true,
        enum: ['login', 'signup', 'logout', 'forgotPassword', 'resetPassword', 'changePassword', 'emailVerification', 'phoneVerification', 'emailVerificationComplete', 'phoneVerificationComplete', 'logoutAllDevices']
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]  // [longitude, latitude]
    },
    deviceInfo: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

// Create geospatial index for location
SessionLocationSchema.index({ location: '2dsphere' });

// Create indexes for efficient queries
SessionLocationSchema.index({ user: 1, createdAt: -1 });
SessionLocationSchema.index({ userDevice: 1, createdAt: -1 });
SessionLocationSchema.index({ eventType: 1 });

module.exports = mongoose.model('SessionLocation', SessionLocationSchema); 