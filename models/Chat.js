const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message schema (embedded document)
const MessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    attachments: [{
        type: String, // URL to attachment
        trim: true
    }]
}, {
    timestamps: true
});

// Chat schema
const ChatSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'pending'],
        default: 'open',
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    messages: [MessageSchema],
    lastMessage: {
        type: Date,
        default: Date.now
    },
    userUnreadCount: {
        type: Number,
        default: 0
    },
    adminUnreadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
ChatSchema.index({ lastMessage: -1 });
ChatSchema.index({ 'messages.sender': 1 });
ChatSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Chat', ChatSchema); 