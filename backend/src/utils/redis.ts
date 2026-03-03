import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        // Only retry up to 3 times before giving up to avoid hanging
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
    }
});

redis.on('error', (err) => {
    // Silent error to avoid crashing if Redis is not available
    console.warn('Redis connection issue:', err.message);
});

export const getRedisData = async (key: string) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null;
    }
};

export const setRedisData = async (key: string, data: any, ttl?: number) => {
    try {
        const value = JSON.stringify(data);
        if (ttl) {
            await redis.set(key, value, 'EX', ttl);
        } else {
            await redis.set(key, value);
        }
    } catch (err) {
        // Ignore error
    }
};

export const clearRedisCache = async (key: string) => {
    try {
        await redis.del(key);
    } catch (err) {
        // Ignore error
    }
};

export default redis;
