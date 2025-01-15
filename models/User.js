const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        sparse: true,
        unique: true,
        lowercase: true,
        index: { collation: { locale: 'en', strength: 2 } },
        trim: true
    },
    verifiedEmail: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    sex: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    avatar: String,
    fcmtoken: String,
    token: String
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
