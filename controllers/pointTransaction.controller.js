const pointTransactionService = require('../services/pointTransaction.service');

/**
 * Get user's point transactions
 */
exports.getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit, transType } = req.query;

        const result = await pointTransactionService.getUserTransactions(userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            transType
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: err.message
        });
    }
};

/**
 * Get user's points balance
 */
exports.getUserPointsBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pointTransactionService.getUserPointsBalance(userId);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching points balance:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch points balance',
            error: err.message
        });
    }
};

/**
 * Award points for getting a random spot
 */
exports.awardRandomSpotPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { spotId } = req.body;

        if (!spotId) {
            return res.status(400).json({
                success: false,
                message: 'Spot ID is required'
            });
        }

        const transaction = await pointTransactionService.awardRandomSpotPoints(userId, spotId);

        res.status(200).json({
            success: true,
            message: `You earned ${transaction.amount} points for discovering a random spot!`,
            transaction
        });
    } catch (err) {
        // If user already received points today, return a 400 status
        if (err.message.includes('already received')) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        console.error('Error awarding random spot points:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to award points',
            error: err.message
        });
    }
}; 