class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
        this.validationErrors = [];
    }

    addError(field, message) {
        this.validationErrors.push({ field, message });
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Not authorized to access this resource') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class DuplicateError extends AppError {
    constructor(message = 'Duplicate entry') {
        super(message, 409);
        this.name = 'DuplicateError';
    }
}

// Async handler to remove try-catch boilerplate
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DuplicateError,
    asyncHandler
}; 