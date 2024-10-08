const mongoose = require('mongoose');
const { Schema } = mongoose;

const spotSchema = new Schema({
    name: { type: String, required: true, trim: true, lowercase: true },
    town: { type: String, required: true, trim: true, lowercase: true },
    contacts: [{ type: Number, required: true }],
    description: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['cafe', 'restaurant', 'hotel', 'bar', 'club', 'other'], 
        trim: true, 
        lowercase: true 
    },
    images: [{ 
        type: String, 
        required: true, 
        trim: true,
    }],
    location: {
        type: { type: String, default: 'Point' },  // GeoJSON point
        coordinates: { type: [Number], required: true }  // [longitude, latitude]
    },
    locationDescription: { type: String, trim: true },  // Added location description
    budget: { type: Number, required: true, min: 0 },
    coverImage: { type: String, trim: true },  // URL or path to the cover image
    profileImage: { type: String, trim: true },  // URL or path to the profile image
    menuImages: [{ type: String, trim: true }],  // Array of image URLs for the menu
    openingTimes: {  // Object to store the opening times for each day of the week
        monday: { type: String, trim: true },
        tuesday: { type: String, trim: true },
        wednesday: { type: String, trim: true },
        thursday: { type: String, trim: true },
        friday: { type: String, trim: true },
        saturday: { type: String, trim: true },
        sunday: { type: String, trim: true }
    },
    fcmtoken: { type: String, trim: true },  // FCM token for push notifications
}, {
    timestamps: true,
    collation: { locale: 'en', strength: 2 }
});

// Create a geospatial index for location
spotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Spot', spotSchema);
