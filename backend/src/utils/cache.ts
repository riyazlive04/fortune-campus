import NodeCache from 'node-cache';
import { getRedisData, setRedisData, clearRedisCache } from './redis';

// Default cache TTL is 5 minutes (300 seconds), check for expired keys every 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const getCachedData = async (key: string) => {
    try {
        // Try Redis first
        const redisData = await getRedisData(key);
        if (redisData) return redisData;
    } catch (err) {
        console.warn(`[Cache] Redis get error for ${key}:`, err);
    }

    // Fallback to local memory
    return cache.get(key);
};

export const setCachedData = async (key: string, data: any, ttl?: number) => {
    try {
        // Save to Redis
        await setRedisData(key, data, ttl);
    } catch (err) {
        console.warn(`[Cache] Redis set error for ${key}:`, err);
    }

    // Save to local memory
    if (ttl !== undefined) {
        return cache.set(key, data, ttl);
    }
    return cache.set(key, data);
};

export const clearCache = async (key: string) => {
    try {
        // Clear Redis
        await clearRedisCache(key);
    } catch (err) {
        console.warn(`[Cache] Redis clear error for ${key}:`, err);
    }

    // Clear local memory
    return cache.del(key);
};

export const flushCache = () => {
    cache.flushAll();
};

export default cache;
