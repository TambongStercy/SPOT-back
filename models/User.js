const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Check if username starts with '@'
                return v.startsWith('@');
            },
            message: props => `Username must start with '@'`
        }
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
    points: {
        type: Number,
        default: 0
    },
    refferalCode: {
        type: String,
        required: true,
        unique: true,
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
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: String,
    fcmtoken: String,
    token: String
}, {
    timestamps: true
});

// Pre-save hook to ensure username starts with '@'
userSchema.pre('save', function (next) {
    // Only modify the username if it's been modified or is new
    if (this.isModified('username') || this.isNew) {
        // If username doesn't start with '@', add it
        if (this.username && !this.username.startsWith('@')) {
            this.username = '@' + this.username;
        }
    }

    // Generate referral code if it's a new user or referral code is not set
    if (this.isNew || !this.refferalCode) {
        // Generate a unique referral code based on username
        this.refferalCode = this.generateReferralCode();
    }

    next();
});

// Method to generate a unique referral code
userSchema.methods.generateReferralCode = function () {
    // Extract username without '@' symbol
    const username = this.username.startsWith('@') ? this.username.substring(1) : this.username;

    // Take first 5 characters of username (or all if less than 5)
    const usernamePrefix = username.substring(0, Math.min(5, username.length)).toUpperCase();

    // Generate a random 4-digit number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    // Combine to create a referral code
    return `${usernamePrefix}${randomDigits}`;
};

module.exports = mongoose.model('User', userSchema);
