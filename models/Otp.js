const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Link OTP to a specific user
    otp: { type: String, required: true },  // OTP code
    expiresAt: { type: Date, required: true },  // Expiration time for the OTP
}, {
    timestamps: true
});

// Automatically remove expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
