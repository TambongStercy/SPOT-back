const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Adding index for better query performance
    },
    spotId: {
        type: Schema.Types.ObjectId,
        ref: 'Spot',
        index: true // Adding index for better query performance
    },
    transType: {
        type: String,
        enum: ['deposit', 'payout'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    message: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Adding index for better query performance
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        index: true // Adding index for better query performance
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});


module.exports = mongoose.model('PointTransactions', transactionSchema);
