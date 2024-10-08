const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },  // Added date of birth
    sex: { type: String, required: true, enum: ['Male', 'Female'] },  // Added sex with Male or Female options
    token: { type: String },  // JWT token for authentication
    avatar: { type: String, trim: true },  // URL or path to the user's avatar
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: false }
    },
    points: { type: Number, default: 0 },  // SPOT POINTS field
    verifiedEmail: { type: Boolean, default: false },  // Field to track if email is verified
    // List of favorite spots (references to the Spot model)
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Spot' }]
}, {
    timestamps: true
});


module.exports = mongoose.model('User', UserSchema);
