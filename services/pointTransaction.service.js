const PointTransaction = require('../models/PointTransactions');
const User = require('../models/User');
const Spot = require('../models/Spot');
const mongoose = require('mongoose');

/**
 * Create a new point transaction
 * @param {Object} transactionData - Transaction data
 * @param {String} transactionData.userId - User ID
 * @param {String} transactionData.spotId - Spot ID (optional)
 * @param {String} transactionData.transType - Transaction type (deposit/payout)
 * @param {String} transactionData.message - Transaction message/reason
 * @param {Number} transactionData.amount - Transaction amount
 * @returns {Promise<Object>} - Created transaction
 */
exports.createTransaction = async (transactionData) => {
    const { userId, spotId, transType, message, amount } = transactionData;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Create transaction with completed status
    const transaction = new PointTransaction({
        userId,
        spotId: spotId || null,
        transType,
        status: 'completed',
        message,
        amount
    });

    // Save transaction
    await transaction.save();

    // Update user's points
    if (transType === 'deposit') {
        user.points += parseInt(amount);
    } else if (transType === 'payout') {
        if (user.points < parseInt(amount)) {
            throw new Error('Insufficient points');
        }
        user.points -= parseInt(amount);
    }

    // Save user
    await user.save();

    return transaction;
};

/**
 * Award referral points
 * @param {String} referrerId - Referrer user ID
 * @param {String} referredId - Referred user ID
 * @returns {Promise<Object>} - Created transactions
 */
exports.awardReferralPoints = async (referrerId, referredId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Award points to referrer (200 points)
        const referrerTransaction = await this.createTransaction({
            userId: referrerId,
            transType: 'deposit',
            message: 'Referral bonus for inviting a new user',
            amount: 200
        });

        // Award points to referred user (50 points)
        const referredTransaction = await this.createTransaction({
            userId: referredId,
            transType: 'deposit',
            message: 'Welcome bonus for using a referral code',
            amount: 50
        });

        await session.commitTransaction();
        session.endSession();

        return {
            referrerTransaction,
            referredTransaction
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/**
 * Award random spot points (20-30 points once per day)
 * @param {String} userId - User ID
 * @param {String} spotId - Spot ID
 * @returns {Promise<Object>} - Created transaction
 */
exports.awardRandomSpotPoints = async (userId, spotId) => {
    // Check if user already received random spot points today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingTransaction = await PointTransaction.findOne({
        userId,
        message: { $regex: 'Random spot bonus' },
        createdAt: { $gte: today, $lt: tomorrow }
    });

    if (existingTransaction) {
        throw new Error('User already received random spot points today');
    }

    // Generate random points between 20-30
    const points = Math.floor(Math.random() * 11) + 20; // 20-30

    // Create transaction
    return await this.createTransaction({
        userId,
        spotId,
        transType: 'deposit',
        message: 'Random spot bonus',
        amount: points
    });
};

/**
 * Get user's point transactions with pagination
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @param {String} options.transType - Transaction type filter
 * @returns {Promise<Object>} - Paginated transactions
 */
exports.getUserTransactions = async (userId, options = {}) => {
    const { page = 1, limit = 20, transType } = options;

    // Build query
    const query = { userId };
    if (transType) {
        query.transType = transType;
    }

    // Count total transactions
    const total = await PointTransaction.countDocuments(query);

    // Get paginated transactions
    const transactions = await PointTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('spotId', 'name type')
        .lean();

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalTransactions: total,
        transactions,
        hasMore: (page - 1) * limit + transactions.length < total
    };
};

/**
 * Get user's points balance
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Points balance
 */
exports.getUserPointsBalance = async (userId) => {
    const user = await User.findById(userId, 'points');
    if (!user) {
        throw new Error('User not found');
    }

    return {
        points: user.points
    };
};

/**
 * Award points from a spot to a user
 * @param {Object} data - Award data
 * @param {String} data.userId - User ID
 * @param {String} data.spotId - Spot ID
 * @param {Number} data.amount - Amount of points to award
 * @param {String} data.reason - Reason for awarding points (e.g., 'check-in', 'review', 'rating')
 * @returns {Promise<Object>} - Created transaction
 */
exports.awardPointsFromSpot = async (data) => {
    const { userId, spotId, amount, reason } = data;

    if (!userId || !spotId || !amount || !reason) {
        throw new Error('Missing required parameters: userId, spotId, amount, and reason are required');
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Validate spot exists
    const spot = await Spot.findById(spotId);
    if (!spot) {
        throw new Error('Spot not found');
    }

    // Check if amount is a positive number
    const pointsAmount = parseInt(amount);
    if (isNaN(pointsAmount) || pointsAmount <= 0) {
        throw new Error('Amount must be a positive number');
    }

    // Create a descriptive message based on the reason
    let message = '';
    switch (reason) {
        case 'check-in':
            message = `Check-in bonus at ${spot.name}`;
            break;
        case 'review':
            message = `Review bonus for ${spot.name}`;
            break;
        case 'rating':
            message = `Rating bonus for ${spot.name}`;
            break;
        case 'visit':
            message = `Visit bonus for ${spot.name}`;
            break;
        default:
            message = `${reason} bonus for ${spot.name}`;
    }

    // Create transaction
    return await this.createTransaction({
        userId,
        spotId,
        transType: 'deposit',
        message,
        amount: pointsAmount
    });
}; 