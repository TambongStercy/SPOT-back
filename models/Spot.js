const mongoose = require('mongoose');
const { Schema } = mongoose;

const SpotSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    menuImages: [{ type: String }],
    town: { type: String, required: true },
    contacts: [{ type: String }],
    type: { type: String, required: true },
    categories: [{
        type: String,
        required: true,
        enum: [
            'Restaurant',
            'Bar',
            'Club',
            'Lounge',
            'Cafe',
            'Fast Food',
            'Fine Dining',
            'Pub',
            'Sports Bar',
            'Rooftop',
            'Beach Club',
            'Shisha Lounge',
            'Live Music Venue',
            'Karaoke Bar',
            'Wine Bar',
            'Cocktail Bar',
            'Other'
        ]
    }],
    cuisine: [{
        type: String,
        enum: [
            'Nigerian',
            'Italian',
            'Chinese',
            'Japanese',
            'Indian',
            'American',
            'Mexican',
            'Thai',
            'Mediterranean',
            'French',
            'Spanish',
            'Greek',
            'Lebanese',
            'Turkish',
            'Korean',
            'Vietnamese',
            'Brazilian',
            'Caribbean',
            'African',
            'Fusion',
            'International',
            'Seafood',
            'Vegetarian',
            'Vegan',
            'BBQ',
            'Steakhouse',
            'Other'
        ]
    }],
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]  // [longitude, latitude]
    },
    locationDescription: { type: String },
    budget: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    coverImage: { type: String, required: true },
    profileImage: { type: String, required: true },
    images: [{ type: String }],
    daysAndTimes: [{ 
        day: { 
            type: String, 
            required: true,
            enum: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            ]
        },
        startTime: { type: String, required: true },  // e.g., "10:00"
        endTime: { type: String, required: true }     // e.g., "22:00"
    }]
}, {
    timestamps: true
});

// Create geospatial index for location
SpotSchema.index({ location: '2dsphere' });

// Create geospatial index for location coordinates
SpotSchema.index({
    'location.coordinates': '2dsphere'
});

// Create text index for searching
SpotSchema.index({ 
    name: 'text', 
    description: 'text',
    town: 'text',
    locationDescription: 'text'
});

// Create compound index for categories and type
SpotSchema.index({ 
    categories: 1, 
    type: 1 
});

// Create compound index for cuisine
SpotSchema.index({ cuisine: 1 });

// Create index for budget range queries
SpotSchema.index({ 
    'budget.min': 1, 
    'budget.max': 1 
});

module.exports = mongoose.model('Spot', SpotSchema);
