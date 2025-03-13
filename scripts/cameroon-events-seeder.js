const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config();

// City coordinates bounds (same as spots)
const CITY_BOUNDS = {
    yaounde: { lat: [3.84, 3.88], lon: [11.48, 11.52] },
    douala: { lat: [4.04, 4.08], lon: [9.68, 9.72] },
    buea: { lat: [4.15, 4.17], lon: [9.23, 9.27] }
};

const EVENT_TYPES = ['concert', 'festival', 'conference', 'sports', 'cultural', 'business', 'other'];
const EVENT_IMAGE_URLS = [
    'https://picsum.photos/800/600?event=1',
    'https://picsum.photos/800/600?event=2',
    'https://picsum.photos/800/600?event=3'
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

const generateEventDates = () => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + Math.floor(Math.random() * 30));

    const endDate = new Date(launchDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);

    return { launchDate, endDate };
};

const generateEventName = (type) => {
    const prefixes = {
        concert: ['Live', 'Music', 'Fest', 'Sound'],
        festival: ['Cultural', 'Food', 'Heritage', 'Arts'],
        conference: ['Tech', 'Business', 'Innovation', 'Leadership']
    };

    const suffixes = {
        concert: ['Night', 'Experience', 'Jam', 'Show'],
        festival: ['Festival', 'Celebration', 'Carnival', 'Fair'],
        conference: ['Summit', 'Forum', 'Conference', 'Symposium']
    };

    return `${prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || 'Event'} ${suffixes[type]?.[Math.floor(Math.random() * suffixes[type].length)] || '2023'
        } ${Math.floor(10 + Math.random() * 90)}`;
};

const generateEvents = async (count) => {
    const events = [];
    const cities = ['yaounde', 'douala', 'buea'];

    for (let i = 0; i < count; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
        const { launchDate, endDate } = generateEventDates();

        const event = {
            name: generateEventName(type),
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} event in ${city} #${Date.now()}-${i}`,
            venue: `${['Stade', 'Palais', 'Centre', 'Arena', 'Plaza'][Math.floor(Math.random() * 5)]
                } ${['Omnisport', 'des Congrès', 'Multifonctionnel', 'Municipal', 'Renaissance'][Math.floor(Math.random() * 5)]
                }`,
            type,
            categories: [Event.schema.path('categories').caster.enumValues[Math.floor(Math.random() * 12)]],
            daysAndTimes: Array.from({ length: Math.ceil(Math.random() * 3) }, () => ({
                day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][Math.floor(Math.random() * 7)],
                startTime: `${17 + Math.floor(Math.random() * 4)}:${Math.random() > 0.5 ? '00' : '30'}`,
                endTime: `${22 + Math.floor(Math.random() * 2)}:${Math.random() > 0.5 ? '00' : '30'}`
            })),
            launchDate,
            endDate,
            location: {
                type: 'Point',
                coordinates: generateCoordinates(city)
            },
            locationDescription: `Located in ${city.charAt(0).toUpperCase() + city.slice(1)} city center`,
            profileImage: EVENT_IMAGE_URLS[Math.floor(Math.random() * EVENT_IMAGE_URLS.length)],
            images: Array.from({ length: 3 }, () => EVENT_IMAGE_URLS[Math.floor(Math.random() * EVENT_IMAGE_URLS.length)]),
            ticketPrice: Math.floor(5000 + Math.random() * 20000),
            contactInfo: {
                phone: generateCameroonianPhone()
            },
            tickets: []
        };

        events.push(event);

        if (events.length % 500 === 0) {
            await Event.insertMany(events);
            events.length = 0;
            console.log(`Inserted ${i + 1} events...`);
        }
    }

    if (events.length > 0) {
        await Event.insertMany(events);
    }
};

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/SPOTT');
        console.log('Connected to MongoDB');

        await Event.deleteMany();
        console.log('Cleared existing events');

        await generateEvents(5000); // Generate 5,000 events
        console.log('Successfully generated Cameroonian events');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error.message);
        process.exit(1);
    }
}

seedDatabase(); 