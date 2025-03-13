const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { stream } = require('./config/logger');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

dotenv.config();
connectDB();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 10000 requests per windowMs
});

app.use(limiter);

// Request logging
app.use(morgan('combined', { stream }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API versioning
const v1Router = express.Router();

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes (v1)
v1Router.use('/auth', require('./routes/authRoutes'));
v1Router.use('/user', require('./routes/userRoutes'));
v1Router.use('/spots', require('./routes/spotRoutes'));
v1Router.use('/events', require('./routes/eventRoutes'));
v1Router.use('/reservations', require('./routes/reservationRoutes'));
v1Router.use('/user-activity', require('./routes/userActivityRoutes'));
v1Router.use('/points', require('./routes/pointTransactionRoutes'));
v1Router.use('/referrals', require('./routes/referralRoutes'));
v1Router.use('/support', require('./routes/chatRoutes'));

// Mount v1 routes
app.use('/api/v1', v1Router);

// Error handling middleware
app.use((err, req, res, next) => {
    const { logger } = require('./config/logger');

    // Log the error
    logger.error({
        message: err.message,
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Send error response
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : err.message,
        stack: process.env.NODE_ENV === 'production'
            ? undefined
            : err.stack
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Resource not found'
    });
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
