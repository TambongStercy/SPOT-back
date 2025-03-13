const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReferralSchema = new Schema({
    referrer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    referred: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Each user can only be referred once
    },
    referralCode: {
        type: String,
        required: true
    },
    pointsAwarded: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
ReferralSchema.index({ referrer: 1, createdAt: -1 });
// Note: We don't need to create an index for 'referred' as it's already indexed by the 'unique: true' property
ReferralSchema.index({ referralCode: 1 });

module.exports = mongoose.model('Referral', ReferralSchema); 