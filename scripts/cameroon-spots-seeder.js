const mongoose = require('mongoose');
const Spot = require('../models/Spot');
const axios = require('axios');
require('dotenv').config();

// City coordinates bounds (approximate)
const CITY_BOUNDS = {
    yaounde: { lat: [3.84, 3.88], lon: [11.48, 11.52] }, // 60% of spots
    douala: { lat: [4.04, 4.08], lon: [9.68, 9.72] },    // 30% of spots
    buea: { lat: [4.15, 4.17], lon: [9.23, 9.27] }      // 10% of spots
};

const SPOT_TYPES = ['restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach', 'other'];
const FOOD_IMAGE_URLS = [
    'https://picsum.photos/800/600?food=1',
    'https://picsum.photos/800/600?food=2',
    'https://picsum.photos/800/600?food=3'
];
const PLACE_IMAGE_URLS = [
    'https://picsum.photos/800/600?venue=1',
    'https://picsum.photos/800/600?venue=2',
    'https://picsum.photos/800/600?venue=3'
];

const generateCoordinates = (city) => {
    const bounds = CITY_BOUNDS[city];
    return [
        bounds.lon[0] + Math.random() * (bounds.lon[1] - bounds.lon[0]),
        bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0])
    ];
};

const generateCameroonianPhone = () => {
    const prefixes = ['23769', '23765', '23767'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(1000000 + Math.random() * 9000000)}`;
};

const generateWorkingHours = () => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
        day,
        startTime: `${Math.floor(8 + Math.random() * 4)}:${Math.random() > 0.5 ? '00' : '30'}`,
        endTime: `${Math.floor(18 + Math.random() * 6)}:${Math.random() > 0.5 ? '00' : '30'}`
    }));
};

const generateSpotName = (type, city) => {
    const prefixes = {
        restaurant: ['Le', 'La', 'Chez', 'Maison'],
        bar: ['Bar', 'Pub', 'Club', 'Lounge'],
        cafe: ['Café', 'Coffee', 'Bistro', 'Patisserie']
    };

    const suffixes = {
        restaurant: ['Savoureux', 'Gastronomique', 'Tradition', 'Plaisir'],
        bar: ['Social', 'Nuit', 'Rencontre', 'Divertissement'],
        cafe: ['Aroma', 'Bean', 'Brew', 'Delight']
    };

    const nameParts = [
        `${prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || ''}`,
        ` ${['Akwa', 'Bonapriso', 'Bastos', 'Makepe', 'Molyko'][Math.floor(Math.random() * 5)]}`,
        ` ${suffixes[type]?.[Math.floor(Math.random() * suffixes[type].length)] || 'Spot'}`
    ];

    return `${nameParts.join('')} ${Math.floor(Math.random() * 100)}`;
};

const generateSpots = async (count) => {
    const spots = [];

    for (let i = 0; i < count; i++) {
        const city = i < 6000 ? 'yaounde' : i < 9000 ? 'douala' : 'buea';
        const type = SPOT_TYPES[Math.floor(Math.random() * SPOT_TYPES.length)];

        const spot = {
            name: generateSpotName(type, city),
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} in ${city} #${Date.now()}-${i} - ${['Great', 'Excellent', 'Premium', 'Lovely'][Math.floor(Math.random() * 4)]} services`,
            town: city.charAt(0).toUpperCase() + city.slice(1),
            contacts: Array.from({ length: Math.ceil(Math.random() * 2) }, generateCameroonianPhone),
            type,
            categories: [Spot.schema.path('categories').caster.enumValues[Math.floor(Math.random() * 17)]],
            location: {
                type: 'Point',
                coordinates: generateCoordinates(city)
            },
            budget: {
                min: Math.floor(5000 + Math.random() * 15000),
                max: Math.floor(10000 + Math.random() * 30000)
            },
            coverImage: PLACE_IMAGE_URLS[Math.floor(Math.random() * PLACE_IMAGE_URLS.length)],
            profileImage: PLACE_IMAGE_URLS[Math.floor(Math.random() * PLACE_IMAGE_URLS.length)],
            menuImages: Array.from({ length: 2 }, () => FOOD_IMAGE_URLS[Math.floor(Math.random() * FOOD_IMAGE_URLS.length)]),
            images: Array.from({ length: 3 }, () => PLACE_IMAGE_URLS[Math.floor(Math.random() * PLACE_IMAGE_URLS.length)]),
            daysAndTimes: generateWorkingHours()
        };

        // Add cuisine only for restaurants
        if (type === 'restaurant') {
            spot.cuisine = [Spot.schema.path('cuisine').caster.enumValues[Math.floor(Math.random() * 27)]];
        }

        spots.push(spot);

        // Insert in batches of 500
        if (spots.length % 500 === 0) {
            await Spot.insertMany(spots);
            spots.length = 0;
            console.log(`Inserted ${i + 1} spots...`);
        }
    }

    // Insert remaining spots
    if (spots.length > 0) {
        await Spot.insertMany(spots);
    }
};

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/SPOTT');
        console.log('Connected to MongoDB');

        await Spot.deleteMany();
        console.log('Cleared existing spots');

        await generateSpots(10000);
        console.log('Successfully generated 10,000 Cameroonian spots');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error.message);
        process.exit(1);
    }
}

seedDatabase(); 