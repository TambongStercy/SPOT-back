const Redis = require('ioredis');
const { logger } = require('./logger');

let redis = null;
let redisEnabled = process.env.ENABLE_REDIS === 'true';

const createRedisClient = () => {
    if (!redisEnabled) {
        logger.info('Redis is disabled via environment variable');
        return null;
    }

    try {
        const client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.error(`Failed to connect to Redis after ${times} attempts, giving up`);
                    return null; // stop retrying
                }
                const delay = Math.min(times * 50, 2000);
                logger.info(`Retrying Redis connection in ${delay}ms...`);
                return delay;
            },
            maxRetriesPerRequest: 1,
            connectTimeout: 5000,
            lazyConnect: true // Don't connect immediately
        });

        return client;
    } catch (error) {
        logger.error('Failed to create Redis client:', error);
        return null;
    }
};

// Initialize Redis client
const initRedis = async () => {
    if (!redis && redisEnabled) {
        redis = createRedisClient();

        if (redis) {
            redis.on('error', (err) => {
                logger.error('Redis Client Error', err);
                // On critical errors, set redis to null so the app falls back to no-cache mode
                if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                    redis = null;
                    logger.warn('Redis connection failed, running without cache');
                }
            });

            redis.on('connect', () => {
                logger.info('Redis Client Connected');
            });

            // Test the connection
            try {
                await redis.connect();
                await redis.ping();
                logger.info('Redis connection test successful');
            } catch (error) {
                logger.error('Redis connection test failed:', error);
                redis = null;
            }
        }
    }
    return redis;
};

// Cache middleware with fallback
const cache = (duration) => {
    return async (req, res, next) => {
        if (!redis || !redisEnabled) {
            return next(); // Skip caching silently
        }

        const key = `cache:${req.originalUrl || req.url}`;
        
        try {
            const cachedResponse = await redis.get(key);
            
            if (cachedResponse) {
                return res.json(JSON.parse(cachedResponse));
            }
            
            // Modify res.json to store the response in cache
            const originalJson = res.json;
            res.json = function(body) {
                if (redis) {
                    redis.setex(key, duration, JSON.stringify(body))
                        .catch(err => logger.error('Cache storage error:', err));
                }
                return originalJson.call(this, body);
            };
            
            next();
        } catch (error) {
            logger.error('Cache Middleware Error', error);
            next();
        }
    };
};

// Initialize Redis when this module is imported
initRedis().catch(err => {
    logger.error('Redis initialization failed:', err);
});

module.exports = { redis, cache }; 