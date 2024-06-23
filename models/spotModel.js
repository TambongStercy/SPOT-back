const mongoose = require('mongoose')
const { Schema } = require('mongoose')

const ratingSchema = new Schema({
    rating: { type: Number, required: true, min: 0, max: 5 },
    review: { type: String, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }  // Assuming there's a User model
}, {
    timestamps: true  // Adds createdAt and updatedAt fields
});

const spot = new Schema({
    name: { type: String, required: true, trim: true, lowercase: true },
    town: { type: String, required: true, trim: true, lowercase: true },
    contacts: [{ type: Number, required: true }],
    description: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['cafe', 'restaurant', 'hotel', 'bar', 'other'], 
        trim: true, 
        lowercase: true 
    },
    images: [{ 
        type: String, 
        required: true, 
        trim: true,
    }],
    location: {
        lon: { type: Number, required: true },
        lat: { type: Number, required: true }
    },
    budget: { 
        type: Number, 
        required: true, 
        min: 0,
    },
    ratings: [ratingSchema]  // Adding ratings as an array of subdocuments
}, {
    collation: { locale: 'en', strength: 2 }
});

const spotModel = mongoose.model('Spot', spot)

module.exports = spotModel