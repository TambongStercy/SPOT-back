// Middleware for role-based authorization
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied. Insufficient permissions.' });
        }
        next(); // Proceed to the next middleware or route handler
    };
};

module.exports = authorizeRoles;
