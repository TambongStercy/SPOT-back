const referralService = require('../services/referral.service');

/**
 * Get referrals made by the authenticated user
 */
exports.getUserReferrals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit } = req.query;

        const result = await referralService.getUserReferrals(userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching user referrals:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch referrals',
            error: err.message
        });
    }
};

/**
 * Get who referred the authenticated user
 */
exports.getUserReferrer = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await referralService.getUserReferrer(userId);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error fetching user referrer:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch referrer information',
            error: err.message
        });
    }
};

/**
 * Validate a referral code
 */
exports.validateReferralCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Referral code is required'
            });
        }

        const result = await referralService.validateReferralCode(code);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error('Error validating referral code:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to validate referral code',
            error: err.message
        });
    }
}; 