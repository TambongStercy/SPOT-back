const mongoose = require('mongoose');
const { Schema } = mongoose;

const StorySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

StorySchema.methods.displayContent = function() {
    return {
        user: this.user,
        spot: this.spot,
        content: this.content,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('Story', StorySchema);
