const Referral = require('../models/Referral');
const User = require('../models/User');
const pointTransactionService = require('./pointTransaction.service');

/**
 * Create a new referral record
 * @param {Object} data - Referral data
 * @param {String} data.referrerId - Referrer user ID
 * @param {String} data.referredId - Referred user ID
 * @param {String} data.referralCode - Referral code used
 * @returns {Promise<Object>} - Created referral record
 */
exports.createReferral = async (data) => {
    const { referrerId, referredId, referralCode } = data;

    // Check if referred user already has a referral
    const existingReferral = await Referral.findOne({ referred: referredId });
    if (existingReferral) {
        throw new Error('User already has a referral record');
    }

    // Get both users to check verification status
    const [referrer, referred] = await Promise.all([
        User.findById(referrerId),
        User.findById(referredId)
    ]);

    if (!referrer || !referred) {
        throw new Error('User not found');
    }

    // Create referral record
    const referral = new Referral({
        referrer: referrerId,
        referred: referredId,
        referralCode,
        pointsAwarded: false,
        status: 'pending'
    });

    // Save referral
    await referral.save();

    // Check if both users are verified
    const isReferrerVerified = referrer.phoneVerified || referrer.verifiedEmail;
    const isReferredVerified = referred.phoneVerified || referred.verifiedEmail;

    // Award points only if both users are verified
    if (isReferrerVerified && isReferredVerified) {
        try {
            const pointsResult = await pointTransactionService.awardReferralPoints(referrerId, referredId);

            // Update referral record to mark points as awarded
            referral.pointsAwarded = true;
            referral.status = 'completed';
            await referral.save();

            return {
                referral,
                pointsAwarded: {
                    referrer: pointsResult.referrerTransaction.amount,
                    referred: pointsResult.referredTransaction.amount
                }
            };
        } catch (error) {
            console.error('Error awarding referral points:', error);
            return { referral };
        }
    }

    return { referral };
};

/**
 * Get referrals made by a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @returns {Promise<Object>} - Paginated referrals
 */
exports.getUserReferrals = async (userId, options = {}) => {
    const { page = 1, limit = 20 } = options;

    // Count total referrals
    const total = await Referral.countDocuments({ referrer: userId });

    // Get paginated referrals
    const referrals = await Referral.find({ referrer: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('referred', 'name username avatar')
        .lean();

    // Get total points earned from referrals
    const pointTransactions = await pointTransactionService.getUserTransactions(userId, {
        transType: 'deposit'
    });

    const referralPoints = pointTransactions.transactions
        .filter(transaction => transaction.message.includes('Referral bonus'))
        .reduce((total, transaction) => total + parseInt(transaction.amount), 0);

    return {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalReferrals: total,
        referrals,
        totalPointsEarned: referralPoints,
        hasMore: (page - 1) * limit + referrals.length < total
    };
};

/**
 * Get who referred a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Referrer information
 */
exports.getUserReferrer = async (userId) => {
    const referral = await Referral.findOne({ referred: userId })
        .populate('referrer', 'name username avatar')
        .lean();

    if (!referral) {
        return { hasReferrer: false };
    }

    return {
        hasReferrer: true,
        referrer: referral.referrer,
        referralDate: referral.createdAt,
        referralCode: referral.referralCode
    };
};

/**
 * Check if a referral code is valid
 * @param {String} code - Referral code
 * @returns {Promise<Object>} - Validation result
 */
exports.validateReferralCode = async (code) => {
    const user = await User.findOne({ refferalCode: code });

    if (!user) {
        return {
            valid: false,
            message: 'Invalid referral code'
        };
    }

    return {
        valid: true,
        referrer: {
            id: user._id,
            name: user.name,
            username: user.username
        }
    };
};

/**
 * Process pending referrals for a user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Processing results
 */
exports.processPendingReferrals = async (userId) => {
    const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
    };

    try {
        // Find all pending referrals where the user is either referrer or referred
        const pendingReferrals = await Referral.find({
            $or: [
                { referrer: userId, pointsAwarded: false },
                { referred: userId, pointsAwarded: false }
            ]
        });

        for (const referral of pendingReferrals) {
            results.processed++;

            try {
                // Get both users
                const [referrer, referred] = await Promise.all([
                    User.findById(referral.referrer),
                    User.findById(referral.referred)
                ]);

                // Check if both users are verified
                const isReferrerVerified = referrer.phoneVerified || referrer.verifiedEmail;
                const isReferredVerified = referred.phoneVerified || referred.verifiedEmail;

                if (isReferrerVerified && isReferredVerified) {
                    // Award points
                    await pointTransactionService.awardReferralPoints(
                        referral.referrer.toString(),
                        referral.referred.toString()
                    );

                    // Update referral status
                    referral.pointsAwarded = true;
                    referral.status = 'completed';
                    await referral.save();

                    results.successful++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    referralId: referral._id,
                    error: error.message
                });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`Failed to process pending referrals: ${error.message}`);
    }
};
