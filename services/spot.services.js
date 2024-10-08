const Spot = require('../models/Spot');


// Service to create a new spot
exports.createSpot = async ({ name, description, menuImages, town, contacts, type, location, budget, coverImage, profileImage, openingTimes }) => {
    const newSpot = new Spot({
        name,
        description,
        menuImages,
        town,
        contacts,
        type,
        location: {
            type: 'Point',
            coordinates: [location.lon, location.lat]
        },
        budget,
        coverImage,
        profileImage,
        openingTimes
    });

    await newSpot.save();
    return newSpot;
};

// Service to update a spot by ID
exports.updateSpot = async ({ spotId, updates }) => {
    const updatedSpot = await Spot.findByIdAndUpdate(spotId, updates, { new: true });
    return updatedSpot;
};

// Service to get all spots
exports.getSpots = async () => {
    const spots = await Spot.find({});
    return spots;
};

// Service to get a spot by its ID
exports.getSpotById = async (spotId) => {
    const spot = await Spot.findById(spotId);
    return spot;
};


// Service to get paginated spots with filters
exports.getFilteredSpots = async ({ page, limit, filters }) => {
    const query = {};

    // Apply filters if they exist
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };  // Case-insensitive search
    if (filters.town) query.town = { $regex: filters.town, $options: 'i' };
    if (filters.contacts) query.contacts = filters.contacts;
    if (filters.type) query.type = filters.type;
    if (filters.budget) query.budget = { $lte: filters.budget };  // Max budget

    // Handle ratings (get spots with average rating greater than or equal to the filter)
    if (filters.ratings) {
        query['ratings.rating'] = { $gte: filters.ratings };
    }

    // Location-based filter (if you have longitude and latitude)
    if (filters.lon && filters.lat) {
        const maxDistanceInKm = 20 * 1000;  // Convert 20 km to meters
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(filters.lon), parseFloat(filters.lat)]
                },
                $maxDistance: maxDistanceInKm
            }
        };
    }

    // Paginate results
    const spots = await Spot.find(query)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .exec();

    // Get total count for pagination
    const total = await Spot.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        spots
    };
};