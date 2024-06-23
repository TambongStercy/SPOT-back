const mongoose = require('mongoose')
const { Schema } = require('mongoose')
const jwt = require('jsonwebtoken')

const user = new Schema({
    name: { type: String, required: true, trim: true, lowercase: true },
    // region: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: Number, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    dateOfBirth: { type: Date, required: true },
    password: { type: String, required: true },
    token: { type: String },
    avatar: { type: String },
    avatarId: { type: String },
    otps: [
        {
            code: {
                type: Number,
                required: true,
            },
            expiration: {
                type: Date,
                required: true,
            },
        },
    ],
}, {
    collation: { locale: 'en', strength: 2 }
});


user.methods.deleteToken = function (token) {
    // I will add a multi-session logic so don't change anything here for now
    this.token = '';
}

user.methods.createToken = async function () {
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY)
    this.token = token
    // this.save()
    return token
}

user.statics.verifyToken = async function (token, email) {
    const trimmedLowercaseEmail = email.trim().toLowerCase()

    const regex = new RegExp('^' + trimmedLowercaseEmail + '$', 'i')


    const userByToken = await this.findOne({ token: token })
    const userByEmail = await this.findOne({ email: { $regex: regex } })



    if (userByToken == null || userByEmail == null || userByToken.id != userByEmail.id) {
        return false
    } else {
        return true
    }
}


// Static method to generate a unique referral code
user.statics.generateUniqueReferralCode = async function () {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const length = 8

    while (true) {
        const code = Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')

        // Check if the generated code already exists in the database
        const existingUser = await this.findOne({ referralCode: code })

        if (!existingUser) {
            return code // Return the code if it's unique
        }
        // If the code already exists, generate a new one and loop again
    }
}

// Method to find and update a user by ID
user.statics.findAndUpdateById = function (userId, updateFields) {
    return this.findByIdAndUpdate(userId, updateFields, { new: true }).exec()
}


//================== FOR EMAIL VERIFICATION =====================

// Method to add a new random OTP to the user model
user.methods.createOTP = async function () {
    const code = generateRandomNumber()

    const newOTP = {
        code: code, // Assuming you have a function to generate a random 6-digit number
        expiration: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiration
    }

    this.otps.push(newOTP)
    this.save()

    return code
}

// Method to delete a specific OTP from the user model
user.methods.deleteOTP = function (otpCode) {
    this.otps = this.otps.filter((otp) => otp.code !== otpCode);
    return this.save();
};

// Method to check if a specific OTP is valid
user.methods.isOTPValid = function (otpCode) {
    const now = new Date();

    // Remove expired OTPs before checking validity
    this.otps = this.otps.filter((otp) => otp.expiration > now);


    const validOTP = this.otps.find((otp) => otp.code === otpCode);

    return !!validOTP; // Returns true if a valid OTP is found, false otherwise
};



function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}

const userModel = mongoose.model('user', user)

module.exports = userModel