const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    daysAndTimes: [{ 
        day: { type: String, required: true },  // e.g., "Monday"
        startTime: { type: String, required: true },  // e.g., "10:00 AM"
        endTime: { type: String, required: true }  // e.g., "02:00 PM"
    }],
    launchDate: { type: Date, required: true },  // When the event will be launched
    endDate: { type: Date, required: true },  // When the event will end
    location: {
        type: { type: String, default: 'Point' },  // GeoJSON point
        coordinates: { type: [Number], required: true }  // [longitude, latitude]
    },
    locationDescription: { type: String, trim: true },  // Added location description
    images: [{ type: String, trim: true }],  // Event images
    ticketImage: { type: String, trim: true },  // Image of the ticket
    tickets: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },  // User who bought the ticket
        quantity: { type: Number, required: true }  // Number of tickets bought
    }],
    ticketPrice: { type: Number, required: true },  // Price per ticket
}, {
    timestamps: true
});

// Create geospatial index for location
EventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Event', EventSchema);
