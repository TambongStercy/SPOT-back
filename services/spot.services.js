const Spot = require('../models/Spot');
const Rating = require('../models/Rating');
const { paginate } = require('../helpers/paginate');
const { trackSearch, trackOpening, getRecommendations, getTrendingItems, getUserPreferences } = require('./userActivity.services');
const UserActivity = require('../models/UserActivity');
const { getRatingStats } = require('./rating.services');

// Define the projection for list views
const LIST_PROJECTION = {
    _id: 1,
    name: 1,
    type: 1,
    town: 1,
    location: 1,
    profileImage: 1,
    daysAndTimes: 1,
    'budget.min': 1,
    'budget.max': 1
};

const queryFromFilter = (filters) => {
    const query = {};

    // Add text search across multiple fields
    if (filters.search && filters.search !== '') {
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

    // Handle map bounds filtering
    if (filters.bounds) {
        const bounds = JSON.parse(filters.bounds);

        const mainBox = [
            [bounds.sw.lng, bounds.sw.lat],
            [bounds.ne.lng, bounds.ne.lat]
        ];

        // Base location query for the main bounds
        query.location = {
            $geoWithin: {
                $box: mainBox
            }
        };

        // Handle excluded bounds if they exist
        if (filters.excludeBounds) {
            const excludeBounds = JSON.parse(filters.excludeBounds);
            if (excludeBounds && excludeBounds.length > 0) {
                // Create array of points that should be excluded
                const excludeQueries = excludeBounds.map(bound => ({
                    location: {
                        $geoWithin: {
                            $box: [
                                [bound.sw.lng, bound.sw.lat],
                                [bound.ne.lng, bound.ne.lat]
                            ]
                        }
                    }
                }));

                // Combine the queries using $nor
                query.$nor = excludeQueries;
            }
        }
    } else if (filters.lon && filters.lat) {
        // Fallback to radius-based filter if no bounds provided
        const maxDistanceInMm = filters.radius ? parseInt(filters.radius) * 1000 : 20 * 1000; // Convert to meters
        const radiusInRadians = maxDistanceInMm / 6378100; // Convert to radians using Earth's radius

        query.location = {
            $geoWithin: {
                $centerSphere: [
                    [parseFloat(filters.lon), parseFloat(filters.lat)],
                    radiusInRadians
                ]
            }
        };
    }



    return query;
};

// Helper function to attach rating stats to spot(s)
const attachRatingToSpots = async (spots) => {
    if (Array.isArray(spots)) {
        const spotsWithRating = await Promise.all(spots.map(async (spot) => {
            const spotObj = spot.toObject ? spot.toObject() : spot;
            const stats = await getRatingStats(spot._id, 'spot');
            spotObj.rating = stats.averageRating;
            spotObj.numberOfRatings = stats.numberOfRatings;
            return spotObj;
        }));
        return spotsWithRating;
    } else if (spots) {
        const spotObj = spots.toObject ? spots.toObject() : spots;
        const stats = await getRatingStats(spots._id, 'spot');
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

// Service to get a spot by its ID
exports.getSpotById = async (spotId, userId = null) => {
    const spot = await Spot.findById(spotId).lean();
    if (spot && userId) {
        // Track opening activity
        await trackOpening(userId, spotId, 'Spot');
    }
    return attachRatingToSpots(spot);
};

// Service to get paginated spots with filters
exports.getFilteredSpots = async ({ page, limit, filters, userId = null }) => {
    try {
        // Track search activity if there's a search query
        if (userId && filters.search) {
            await trackSearch(userId, 'Spot', filters.search);
        }

        // Get base query from filter
        const query = queryFromFilter(filters);

        // Handle ratings filter
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
            const spotIds = ratingAggregation.map(r => r._id);
            query._id = { $in: spotIds };
        }

        // Get spots with all filters applied and projection
        const spots = await Spot.find(query, LIST_PROJECTION)
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
            spots: spotsWithRatings,
            hasMore: (page - 1) * limit + spots.length < total
        };
    } catch (error) {
        console.error('Error getting filtered spots:', error);
        throw error;
    }
};

// Get recommended spots with preference-based fallback
exports.getRecommendedSpots = async ({ userId, page = 1, limit = 10, filters = {} }) => {
    try {
        // Build the base query using the same mechanism as getFilteredSpots
        const query = queryFromFilter(filters);

        // Get all spots that match the filters
        const allSpots = await Spot.find(query, LIST_PROJECTION).lean();

        // Get user preferences and score the filtered spots
        const preferences = await getUserPreferences(userId, 'Spot');
        let scoredSpots = allSpots.map(spot => {
            let score = 0;

            // Score based on categories
            if (preferences.categories.length) {
                spot.categories.forEach(category => {
                    const categoryIndex = preferences.categories.indexOf(category);
                    if (categoryIndex !== -1) {
                        // Higher score for more preferred categories
                        score += (preferences.categories.length - categoryIndex);
                    }
                });
            }

            // Score based on type
            if (preferences.types.length && preferences.types.includes(spot.type)) {
                const typeIndex = preferences.types.indexOf(spot.type);
                score += (preferences.types.length - typeIndex) * 2;
            }

            // Score based on town
            if (preferences.towns.length && preferences.towns.includes(spot.town)) {
                const townIndex = preferences.towns.indexOf(spot.town);
                score += (preferences.towns.length - townIndex) * 1.5;
            }

            return {
                ...spot,
                recommendationScore: score
            };
        });

        // Sort by recommendation score
        scoredSpots.sort((a, b) => b.recommendationScore - a.recommendationScore);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSpots = scoredSpots.slice(startIndex, endIndex);

        // Attach ratings
        const spotsWithRatings = await attachRatingToSpots(paginatedSpots);

        // Get total count
        const total = scoredSpots.length;

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalSpots: total,
            spots: spotsWithRatings,
            hasMore: (page - 1) * limit + paginatedSpots.length < total
        };
    } catch (error) {
        console.error('Error getting recommended spots:', error);
        throw error;
    }
};

// Get trending spots
exports.getTrendingSpots = async ({ page = 1, limit = 10, days = 30, filters = {} }) => {
    try {
        // Build the base query using the same mechanism as getFilteredSpots
        const query = queryFromFilter(filters);

        // Get all spots that match the filters
        const allSpots = await Spot.find(query, LIST_PROJECTION).lean();

        // Get activity stats for filtered spots
        const activityStats = await UserActivity.aggregate([
            {
                $match: {
                    itemType: 'Spot',
                    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
                    item: { $in: allSpots.map(spot => spot._id) }
                }
            },
            {
                $group: {
                    _id: '$item',
                    views: { $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] } },
                    likes: { $sum: { $cond: [{ $eq: ['$action', 'like'] }, 1, 0] } },
                    favorites: { $sum: { $cond: [{ $eq: ['$action', 'favorite'] }, 1, 0] } }
                }
            }
        ]);

        // Score spots based on activity
        const scoredSpots = allSpots.map(spot => {
            const stats = activityStats.find(stat => stat._id.toString() === spot._id.toString()) ||
                { views: 0, likes: 0, favorites: 0 };

            const trendingScore = (stats.views * 1) + (stats.likes * 2) + (stats.favorites * 3);

            return {
                ...spot,
                trendingStats: {
                    score: trendingScore,
                    views: stats.views,
                    likes: stats.likes,
                    favorites: stats.favorites
                }
            };
        });

        // Sort by trending score
        scoredSpots.sort((a, b) => b.trendingStats.score - a.trendingStats.score);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSpots = scoredSpots.slice(startIndex, endIndex);

        // Attach ratings
        const spotsWithRatings = await attachRatingToSpots(paginatedSpots);

        // Get total count
        const total = scoredSpots.length;

        return {
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalSpots: total,
            spots: spotsWithRatings,
            hasMore: (page - 1) * limit + paginatedSpots.length < total
        };
    } catch (error) {
        console.error('Error getting trending spots:', error);
        throw error;
    }
};

// Get a random recommended spot for a user
exports.getRandomRecommendedSpot = async (userId) => {
    try {
        // First, try to get a personalized recommendation based on user preferences
        const userPreferences = await getUserPreferences(userId, 'Spot');

        let query = {};
        let randomSpot = null;

        // If we have user preferences, use them to find a relevant spot
        if (userPreferences && Object.keys(userPreferences).length > 0) {
            // Build query based on user preferences
            if (userPreferences.categories && userPreferences.categories.length > 0) {
                // Get top 3 categories the user interacts with most
                const topCategories = Object.entries(userPreferences.categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(entry => entry[0]);

                if (topCategories.length > 0) {
                    query.categories = { $in: topCategories };
                }
            }

            if (userPreferences.cuisine && userPreferences.cuisine.length > 0) {
                // Get top 3 cuisines the user interacts with most
                const topCuisines = Object.entries(userPreferences.cuisine)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(entry => entry[0]);

                if (topCuisines.length > 0) {
                    query.cuisine = { $in: topCuisines };
                }
            }

            // Try to find a spot matching user preferences
            const count = await Spot.countDocuments(query);

            if (count > 0) {
                // Get a random spot from the filtered results
                const random = Math.floor(Math.random() * count);
                randomSpot = await Spot.findOne(query).skip(random);
            }
        }

        // If no spot found with preferences or no preferences exist, get a random spot
        if (!randomSpot) {
            const count = await Spot.countDocuments({});
            if (count > 0) {
                const random = Math.floor(Math.random() * count);
                randomSpot = await Spot.findOne({}).skip(random);
            }
        }

        // If we found a spot, track this as an opening for recommendation purposes
        if (randomSpot && userId) {
            await trackOpening(userId, randomSpot._id, 'Spot');
        }

        // Attach rating information
        return randomSpot ? await attachRatingToSpots(randomSpot) : null;
    } catch (error) {
        console.error('Error getting random recommended spot:', error);
        throw error;
    }
};
