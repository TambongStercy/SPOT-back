const Event = require('../models/Event');

// Create a new event
exports.createEvent = async (eventData) => {
    const newEvent = new Event(eventData);
    await newEvent.save();
    return newEvent;
};

// Get an event by ID
exports.getEventById = async (eventId) => {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');
    return event;
};

// Update an event by ID
exports.updateEvent = async (eventId, updates) => {
    const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, { new: true });
    if (!updatedEvent) throw new Error('Event not found');
    return updatedEvent;
};

// Delete an event by ID
exports.deleteEvent = async (eventId) => {
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) throw new Error('Event not found');
    return deletedEvent;
};

// Buy tickets for an event
exports.buyTickets = async (userId, eventId, quantity) => {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    // Add tickets for the user
    event.tickets.push({
        user: userId,
        quantity
    });
    await event.save();

    return event;
};



// Service to get active events with pagination and filters
exports.getActiveEvents = async ({ page = 1, limit = 10, filters }) => {
    const query = { endDate: { $gte: new Date() } };  // Only events that haven't ended yet

    // Apply filters
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.location) query['location.coordinates'] = { $near: filters.location };
    if (filters.startDate) query.launchDate = { $gte: new Date(filters.startDate) };

    const events = await Event.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()  // Retrieve only plain JS objects
        .exec();

    const total = await Event.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        events
    };
};

// Service to get ended events with pagination and filters
exports.getEndedEvents = async ({ page = 1, limit = 10, filters }) => {
    const query = { endDate: { $lt: new Date() } };  // Only events that have ended

    // Apply filters
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.location) query['location.coordinates'] = { $near: filters.location };
    if (filters.endDate) query.endDate = { $lte: new Date(filters.endDate) };

    const events = await Event.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()  // Retrieve only plain JS objects
        .exec();

    const total = await Event.countDocuments(query);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        events
    };
};