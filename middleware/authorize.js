const User = require('../models/User');

/**
 * Middleware to authorize admin users
 */
exports.authorizeAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get user with role
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is an admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }

        next();
    } catch (error) {
        console.error('Error in admin authorization:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Middleware to authorize specific roles
 * @param {String|Array} roles - Role or array of roles allowed to access the resource
 */
exports.authorizeRoles = (roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Get user with role
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Convert roles to array if it's a string
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            // Check if user's role is in the allowed roles
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied: ${allowedRoles.join(' or ')} role required`
                });
            }

            next();
        } catch (error) {
            console.error('Error in role authorization:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };
};
