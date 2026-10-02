const { getRedisClient, getIsRedisConnected } = require('../config/redis');
const logger = require('../utils/logger');

const DEFAULT_TTL = 300; // 5 minutes
const memoryCache = new Map();
const memoryExpiry = new Map();

/**
 * Get a cached value. Returns null if not cached or Redis unavailable.
 */
const get = async (key) => {
  if (!getIsRedisConnected()) {
    // Memory fallback
    const expiry = memoryExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      return memoryCache.get(key);
    }
    return null;
  }
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.warn(`[Cache] GET error for key "${key}": ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value with optional TTL (seconds).
 */
const set = async (key, value, ttl = DEFAULT_TTL) => {
  if (!getIsRedisConnected()) {
    // Memory fallback
    memoryCache.set(key, value);
    memoryExpiry.set(key, Date.now() + ttl * 1000);
    return;
  }
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn(`[Cache] SET error for key "${key}": ${err.message}`);
  }
};

/**
 * Delete a specific cache key.
 */
const del = async (key) => {
  memoryCache.delete(key);
  memoryExpiry.delete(key);
  if (!getIsRedisConnected()) return;
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    logger.warn(`[Cache] DEL error for key "${key}": ${err.message}`);
  }
};

/**
 * Delete all keys matching a pattern (e.g. 'products:*').
 */
const flush = async (pattern) => {
  // Simple memory flush (clears all for simplicity, or we could regex match)
  if (pattern.includes('*')) {
    memoryCache.clear();
    memoryExpiry.clear();
  } else {
    memoryCache.delete(pattern);
    memoryExpiry.delete(pattern);
  }
  
  if (!getIsRedisConnected()) return;
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info(`[Cache] Flushed ${keys.length} key(s) matching "${pattern}"`);
    }
  } catch (err) {
    logger.warn(`[Cache] FLUSH error for pattern "${pattern}": ${err.message}`);
  }
};

/**
 * Cache-aside helper: get from cache, or fetch from DB and cache result.
 */
const remember = async (key, fetcher, ttl = DEFAULT_TTL) => {
  const cached = await get(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await set(key, fresh, ttl);
  return fresh;
};

module.exports = { get, set, del, flush, remember };
