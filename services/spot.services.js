const Spot = require('../models/Spot');
const Rating = require('../models/Rating');

const queryFromFilter = (filters) => {
    const query = {};
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.town) query.town = { $regex: filters.town, $options: 'i' };
    if (filters.contacts) query.contacts = filters.contacts;
    if (filters.type) query.type = filters.type;
    if (filters.budget) {
        // If budget is provided, find spots where the provided budget falls within their range
        query.$and = [
            { 'budget.min': { $lte: filters.budget } },
            { 'budget.max': { $gte: filters.budget } }
        ];
    }
    if (filters.minBudget) {
        query['budget.min'] = { $gte: filters.minBudget };
    }
    if (filters.maxBudget) {
        query['budget.max'] = { $lte: filters.maxBudget };
    }
    if (filters.cuisine) {
        query.cuisine = Array.isArray(filters.cuisine)
            ? { $in: filters.cuisine }
            : filters.cuisine;
    }
    return query;
};

// Helper function to get rating stats for a spot
const getRatingStats = async (spotId) => {
    const ratings = await Rating.find({ spot: spotId });
    if (!ratings || ratings.length === 0) {
        return {
            averageRating: 0,
            numberOfRatings: 0
        };
    }
    
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return {
        averageRating: parseFloat((sum / ratings.length).toFixed(1)),
        numberOfRatings: ratings.length
    };
};

// Helper function to attach rating stats to spot(s)
const attachRatingToSpots = async (spots) => {
    if (Array.isArray(spots)) {
        const spotsWithRating = await Promise.all(spots.map(async (spot) => {
            const spotObj = spot.toObject ? spot.toObject() : spot;
            const stats = await getRatingStats(spot._id);
            spotObj.rating = stats.averageRating;
            spotObj.numberOfRatings = stats.numberOfRatings;
            return spotObj;
        }));
        return spotsWithRating;
    } else if (spots) {
        const spotObj = spots.toObject ? spots.toObject() : spots;
        const stats = await getRatingStats(spots._id);
        spotObj.rating = stats.averageRating;
        spotObj.numberOfRatings = stats.numberOfRatings;
        return spotObj;
    }
    return null;
};

// Service to create a new spot
exports.createSpot = async ({ name, description, menuImages, town, contacts, type, categories, cuisine, location, budget, coverImage, profileImage, daysAndTimes }) => {
    // Validate budget
    if (budget.max < budget.min) {
        throw new Error('Maximum budget cannot be less than minimum budget');
    }

    const newSpot = new Spot({
        name,
        description,
        menuImages,
        town,
        contacts,
        type,
        categories,
        cuisine,
        location: {
            type: 'Point',
            coordinates: [location.lon, location.lat]
        },
        budget: {
            min: budget.min,
            max: budget.max
        },
        coverImage,
        profileImage,
        daysAndTimes
    });

    await newSpot.save();
    return attachRatingToSpots(newSpot);
};

// Service to update a spot by ID
exports.updateSpot = async ({ spotId, updates }) => {
    // Ensure proper format for daysAndTimes if it's being updated
    if (updates.daysAndTimes) {
        // Validate each day entry
        updates.daysAndTimes.forEach(timeSlot => {
            if (!timeSlot.day || !timeSlot.startTime || !timeSlot.endTime) {
                throw new Error('Each time slot must have day, startTime, and endTime');
            }
            // Capitalize first letter of day
            timeSlot.day = timeSlot.day.charAt(0).toUpperCase() + timeSlot.day.slice(1).toLowerCase();
        });
    }

    const updatedSpot = await Spot.findByIdAndUpdate(spotId, updates, { new: true, runValidators: true });
    return attachRatingToSpots(updatedSpot);
};

// Service to get all spots
exports.getSpots = async () => {
    const spots = await Spot.find({});
    return attachRatingToSpots(spots);
};

// Service to get a spot by its ID
exports.getSpotById = async (spotId) => {
    const spot = await Spot.findById(spotId);
    return attachRatingToSpots(spot);
};

// Service to get paginated spots with filters
exports.getFilteredSpots = async ({ page, limit, filters }) => {
    const query = {};

    // Add text search across multiple fields
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { town: { $regex: filters.search, $options: 'i' } },
            { locationDescription: { $regex: filters.search, $options: 'i' } }
        ];
    } else {
        // Apply individual field filters if no general search
        if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
        if (filters.town) query.town = { $regex: filters.town, $options: 'i' };
    }

    // Apply other filters
    if (filters.contacts) query.contacts = filters.contacts;
    if (filters.type) query.type = filters.type;
    
    // Handle budget filters
    if (filters.budget) {
        // If single budget value provided, find spots where it falls within their range
        query.$and = [
            { 'budget.min': { $lte: filters.budget } },
            { 'budget.max': { $gte: filters.budget } }
        ];
    } else {
        // Handle separate min and max budget filters
        if (filters.minBudget) {
            query['budget.min'] = { $gte: filters.minBudget };
        }
        if (filters.maxBudget) {
            query['budget.max'] = { $lte: filters.maxBudget };
        }
    }

    // Handle cuisine filter
    if (filters.cuisine) {
        query.cuisine = Array.isArray(filters.cuisine)
            ? { $in: filters.cuisine }
            : filters.cuisine;
    }

    // Handle categories filter
    if (filters.categories) {
        query.categories = Array.isArray(filters.categories)
            ? { $in: filters.categories }
            : filters.categories;
    }

    // Handle day and time filters
    if (filters.day) {
        const day = filters.day.charAt(0).toUpperCase() + filters.day.slice(1).toLowerCase();
        query['daysAndTimes.day'] = day;
    }

    if (filters.time) {
        const time = filters.time;
        query['daysAndTimes'] = {
            $elemMatch: {
                startTime: { $lte: time },
                endTime: { $gte: time }
            }
        };
    }

    // Location-based filter
    if (filters.lon && filters.lat) {
        const maxDistanceInKm = filters.radius ? parseInt(filters.radius) * 1000 : 20 * 1000; // Convert to meters
        const radiusInRadians = maxDistanceInKm / 6378100; // Convert to radians using Earth's radius

        query.location = {
            $geoWithin: {
                $centerSphere: [
                    [parseFloat(filters.lon), parseFloat(filters.lat)],
                    radiusInRadians
                ]
            }
        };
    }

    // Handle ratings filter
    let spotIds = [];
    if (filters.rating) {
        const minRating = parseFloat(filters.rating);
        
        // Get average ratings for all spots
        const ratingAggregation = await Rating.aggregate([
            {
                $group: {
                    _id: '$spot',
                    averageRating: { $avg: '$rating' },
                    numberOfRatings: { $sum: 1 }
                }
            },
            {
                $match: {
                    averageRating: { $gte: minRating }
                }
            }
        ]);

        // Extract spot IDs that meet the rating criteria
        spotIds = ratingAggregation.map(r => r._id);
        query._id = { $in: spotIds };
    }

    // Get spots with all filters applied
    const spots = await Spot.find(query)
        .sort(filters.sortBy === 'rating' ? {} : { [filters.sortBy || 'createdAt']: filters.sortOrder || -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .exec();

    // Attach ratings
    let spotsWithRatings = await attachRatingToSpots(spots);

    // Sort by rating if specified
    if (filters.sortBy === 'rating') {
        spotsWithRatings.sort((a, b) => {
            if (filters.sortOrder === 'asc') {
                return a.rating === b.rating ? b.numberOfRatings - a.numberOfRatings : a.rating - b.rating;
            }
            return a.rating === b.rating ? b.numberOfRatings - a.numberOfRatings : b.rating - a.rating;
        });
    }

    // Get total count
    const total = await Spot.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalSpots: total,
        spots: spotsWithRatings
    };
};

// Get nearby spots with pagination
exports.getNearbySpots = async ({ latitude, longitude, radius, page, limit, filters }) => {
    try {
        // Convert radius from meters to radians (required for $centerSphere)
        const radiusInRadians = radius / 6378100; // Earth's radius in meters

        // Build the base query including the geospatial condition
        const query = {
            ...queryFromFilter(filters),
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radiusInRadians]
                }
            }
        };

        // Get total count for pagination
        const totalSpots = await Spot.countDocuments(query);

        // Get paginated spots
        const spots = await Spot.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        // Attach ratings to spots
        const spotsWithRatings = await attachRatingToSpots(spots);

        return {
            spots: spotsWithRatings,
            currentPage: page,
            totalPages: Math.ceil(totalSpots / limit),
            totalSpots,
            hasMore: (page - 1) * limit + spots.length < totalSpots
        };
    } catch (error) {
        console.error('Error in getNearbySpots:', error);
        throw error;
    }
};