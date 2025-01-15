const mongoose = require('mongoose');
const Spot = require('../models/Spot');
const Event = require('../models/Event');
const axios = require('axios');
require('dotenv').config();

// Helper function to generate random coordinates in Lagos
const generateLagosCoordinates = () => {
    const bounds = {
        minLon: 3.1,
        maxLon: 3.7,
        minLat: 6.3,
        maxLat: 6.7
    };
    return [
        bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon),
        bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat)
    ];
};

// Helper function to generate coordinates within 15km of a specific point
const generateNearbyCoordinates = (centerLat, centerLon, radiusKm) => {
    // Earth's radius in kilometers
    const R = 6371;

    // Convert radius from kilometers to radians
    const radiusInRadian = radiusKm / R;

    // Generate random distance and bearing
    const randomDistance = Math.random() * radiusInRadian;
    const randomBearing = Math.random() * 2 * Math.PI;

    // Convert latitude and longitude to radians
    const latRad = centerLat * Math.PI / 180;
    const lonRad = centerLon * Math.PI / 180;

    // Calculate new position
    const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(randomDistance) +
        Math.cos(latRad) * Math.sin(randomDistance) * Math.cos(randomBearing)
    );

    const newLonRad = lonRad + Math.atan2(
        Math.sin(randomBearing) * Math.sin(randomDistance) * Math.cos(latRad),
        Math.cos(randomDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    // Convert back to degrees
    const newLat = newLatRad * 180 / Math.PI;
    const newLon = newLonRad * 180 / Math.PI;

    return [newLon, newLat];
};

// Helper function to generate random time
const generateRandomTime = () => {
    const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const minutes = ['00', '30'][Math.floor(Math.random() * 2)];
    return `${hours}:${minutes}`;
};

// Helper function to generate random budget range
const generateRandomBudget = () => {
    const budgetRanges = [
        { min: 5000, max: 15000 },
        { min: 10000, max: 25000 },
        { min: 20000, max: 40000 },
        { min: 30000, max: 60000 },
        { min: 50000, max: 100000 }
    ];
    return budgetRanges[Math.floor(Math.random() * budgetRanges.length)];
};

// Helper function to generate random phone numbers
const generateRandomPhone = () => {
    return `+234${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
};

// Fetch Unsplash images
const fetchUnsplashImages = async (query, count) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&client_id=${accessKey}`;
    try {
        const response = await axios.get(url);
        return response.data.results.map(photo => photo.urls.regular);
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error);
        return [];
    }
};

// Helper function to generate spot description
const generateSpotDescription = (type, index) => {
    const descriptions = [
        `Experience the finest ${type} in Lagos with our signature service and unique ambiance`,
        `A premium ${type} destination offering exceptional dining and entertainment`,
        `Discover Lagos's most exclusive ${type} featuring world-class amenities`,
        `An iconic ${type} known for its exceptional atmosphere and service`,
        `The perfect ${type} spot for both casual and special occasions`
    ];
    return `${descriptions[index % descriptions.length]} (Spot ${index + 1})`;
};

// Helper function to generate event description
const generateEventDescription = (index) => {
    const descriptions = [
        'A spectacular gathering featuring top performers and unique experiences',
        'An immersive event that brings together culture, entertainment, and innovation',
        'Join us for an unforgettable celebration of music, art, and community'
    ];
    return `${descriptions[index % descriptions.length]} (Event ${index + 1})`;
};

// Helper function to generate random cuisines based on type
const generateRandomCuisines = (type) => {
    const cuisines = [
        'Nigerian', 'Italian', 'Chinese', 'Japanese', 'Indian',
        'American', 'Mexican', 'Thai', 'Mediterranean', 'French',
        'Spanish', 'Greek', 'Lebanese', 'Turkish', 'Korean',
        'Vietnamese', 'Brazilian', 'Caribbean', 'African',
        'Fusion', 'International', 'Seafood', 'Vegetarian',
        'Vegan', 'BBQ', 'Steakhouse', 'Other'
    ];

    // For non-restaurant types, return undefined
    if (!['restaurant', 'cafe'].includes(type.toLowerCase())) {
        return undefined;
    }

    // Generate 1-3 random cuisines
    const numCuisines = Math.floor(Math.random() * 3) + 1;
    const selectedCuisines = new Set();

    while (selectedCuisines.size < numCuisines) {
        selectedCuisines.add(cuisines[Math.floor(Math.random() * cuisines.length)]);
    }

    return Array.from(selectedCuisines);
};

// Helper function to generate random ticket price
const generateRandomTicketPrice = () => {
    const prices = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
    return prices[Math.floor(Math.random() * prices.length)];
};

// Generate diverse spots
const generateSpots = (placeImages, foodImages) => {
    const spotTypes = ['restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach'];
    const spotCategories = [
        'Restaurant', 'Bar', 'Club', 'Lounge', 'Cafe',
        'Fast Food', 'Fine Dining', 'Pub', 'Sports Bar',
        'Rooftop', 'Beach Club', 'Shisha Lounge',
        'Live Music Venue', 'Karaoke Bar', 'Wine Bar',
        'Cocktail Bar', 'Other'
    ];
    const towns = ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba'];

    // Generate 150 spot names
    const spotNames = Array(150).fill(null).map((_, index) => {
        const prefixes = ['The', 'Urban', 'City', 'Royal', 'Golden', 'Blue', 'Silver', 'Crystal', 'Ocean', 'Sky'];
        const middles = ['Spot', 'Lounge', 'Bar', 'Cafe', 'Restaurant', 'Club', 'Hub', 'Place', 'View', 'Garden'];
        const suffixes = ['Lagos', 'Premium', 'Elite', 'Plus', 'Express', 'Deluxe', 'Prime', 'VIP', 'Classic', 'Exclusive'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const middle = middles[Math.floor(Math.random() * middles.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${middle} ${suffix} ${index + 1}`;
    });

    return Array(150).fill(null).map((_, index) => {
        const type = spotTypes[Math.floor(Math.random() * spotTypes.length)];
        const numContacts = Math.floor(Math.random() * 2) + 1;
        const selectedCategories = [spotCategories[Math.floor(Math.random() * spotCategories.length)]];
        const randomImage = (images) => images[Math.floor(Math.random() * images.length)];

        // Generate coordinates based on index
        // 80% of spots within 15km of the specified location
        const coordinates = index < 120 
            ? generateNearbyCoordinates(4.15405336, 9.2970976, 15) 
            : generateLagosCoordinates();

        return {
            name: spotNames[index],
            description: generateSpotDescription(type, index),
            menuImages: [randomImage(foodImages), randomImage(foodImages)],
            town: towns[Math.floor(Math.random() * towns.length)],
            contacts: Array(numContacts).fill(null).map(() => generateRandomPhone()),
            type,
            categories: selectedCategories,
            cuisine: generateRandomCuisines(type),
            images: [randomImage(placeImages), randomImage(placeImages)],
            location: { 
                type: 'Point', 
                coordinates: coordinates
            },
            locationDescription: `Located in ${towns[Math.floor(Math.random() * towns.length)]}`,
            budget: generateRandomBudget(),
            coverImage: randomImage(placeImages),
            profileImage: randomImage(placeImages),
            daysAndTimes: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
                day,
                startTime: generateRandomTime(),
                endTime: generateRandomTime()
            }))
        };
    });
};

// Generate Events
const generateEvents = (placeImages) => {
    // Generate 150 event names
    const eventNames = Array(150).fill(null).map((_, index) => {
        const prefixes = ['Lagos', 'African', 'Nigerian', 'West African', 'International'];
        const middles = ['Festival', 'Conference', 'Exhibition', 'Show', 'Concert', 'Summit', 'Expo', 'Fair', 'Gala', 'Awards'];
        const suffixes = ['2024', 'Premium', 'Elite', 'Special', 'Grand', 'Exclusive', 'Deluxe', 'Prime'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const middle = middles[Math.floor(Math.random() * middles.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${middle} ${suffix} ${index + 1}`;
    });

    const venues = [
        'Eko Hotels & Suites', 'Landmark Event Centre', 'Federal Palace Hotel',
        'Balmoral Convention Center', 'The Civic Center', 'Terra Kulture',
        'Muri Okunola Park', 'Oriental Hotel', 'Tafawa Balewa Square',
        'Freedom Park Lagos', 'New Afrika Shrine', 'Lagos Continental Hotel'
    ];

    const categories = ['Music', 'Arts', 'Food', 'Technology', 'Business', 'Education', 'Entertainment', 'Lifestyle', 'Community', 'Charity'];
    const today = new Date();

    return Array(150).fill(null).map((_, index) => {
        const startDate = new Date(today);
        let endDate = new Date(startDate);

        // Distribute events over the next 3 months
        startDate.setDate(today.getDate() + Math.floor(Math.random() * 90));
        endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days duration

        const randomImage = (images) => images[Math.floor(Math.random() * images.length)];

        // 80% of events within 15km of the specified location
        const coordinates = index < 120
            ? generateNearbyCoordinates(4.15405336, 9.2970976, 15)
            : generateLagosCoordinates();

        return {
            name: eventNames[index],
            description: generateEventDescription(index),
            venue: venues[Math.floor(Math.random() * venues.length)],
            contactInfo: { 
                phone: generateRandomPhone(), 
                email: `event${index + 1}@example.com`,
                website: `https://event${index + 1}.com`
            },
            categories: [categories[Math.floor(Math.random() * categories.length)]],
            daysAndTimes: ['Monday', 'Wednesday', 'Friday'].map(day => ({
                day,
                startTime: generateRandomTime(),
                endTime: generateRandomTime()
            })),
            launchDate: startDate,
            endDate: endDate,
            location: { 
                type: 'Point', 
                coordinates: coordinates
            },
            locationDescription: `Located at ${venues[Math.floor(Math.random() * venues.length)]}`,
            images: [randomImage(placeImages), randomImage(placeImages)],
            ticketImage: randomImage(placeImages),
            ticketPrice: generateRandomTicketPrice()
        };
    });
};

async function seedDatabase() {
    try {
        const placeImages = await fetchUnsplashImages('places', 100);
        const foodImages = await fetchUnsplashImages('food', 50);

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/SPOTT');
        console.log('Connected to MongoDB');
        await Spot.deleteMany({});
        await Event.deleteMany({});
        console.log('Cleared existing data');

        const spots = generateSpots(placeImages, foodImages);
        const createdSpots = await Spot.insertMany(spots);
        console.log(`Inserted ${createdSpots.length} spots`);

        const events = generateEvents(placeImages);
        const createdEvents = await Event.insertMany(events);
        console.log(`Inserted ${createdEvents.length} events`);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}
seedDatabase(); 
