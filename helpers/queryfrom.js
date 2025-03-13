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

module.exports = { queryFromFilter };