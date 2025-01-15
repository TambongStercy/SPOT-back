const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserDeviceSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fcmToken: { 
        type: String, 
        required: true,
        unique: true 
    },
    deviceInfo: {
        type: String,
        required: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create compound index for user and fcmToken
UserDeviceSchema.index({ user: 1, fcmToken: 1 }, { unique: true });

module.exports = mongoose.model('UserDevice', UserDeviceSchema); 